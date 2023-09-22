define(["jquery", "underscore", "datatables.net", "backbone", "handlebars", "text!output/variantTable.hbs", "text!options/modal.hbs", "picSure/settings",
        "common/config", "common/spinner"],
    function($, _, datatables, BB, HBS, variantTableTemplate, modalTemplate, settings,
             config, spinner){
        const maxVariantCount =  settings.maxVariantCount ? settings.maxVariantCount : 1000;
        let createDownloadLink = function(response, selector){
            //now add a handy download link!
            $(selector).append("<a id='variant-download-btn'>Download Variant Data</a>");
            const responseDataUrl = URL.createObjectURL(new Blob([response], {type: "octet/stream"}));
            $("#variant-download-btn", $(selector)).off('click');
            $("#variant-download-btn", $(selector)).attr("href", responseDataUrl);
            $("#variant-download-btn", $(selector)).attr("download", "variantData.tsv");
        }
        let variantExplorerView = BB.View.extend({
            initialize: function(opts) {
                this.baseQuery = opts.query;
                this.dataErrorMsg = opts.errorMsg ? opts.errorMsg : "There was an error loading the data";
                this.variantTableTemplate = HBS.compile(variantTableTemplate);
                this.modalTitleSelector = opts.modalTitleSelector ? opts.modalTitleSelector : '.modal-title';
                this.modalHeaderSelector = opts.modalTitleSelector ? opts.modalTitleSelector : '.modal-header';
            },
            createDataTable: function(){
                let renderComplete = $.Deferred();
                $('#vcfData').DataTable( {
                    data: this.variantData["variants"],
                    columns: _.map(this.variantData['headers'],(header)=>{
                        return {title:header }
                    }),columnDefs: [
                        {
                            targets: '_all',
                            className: 'dt-center'
                        },
                        {
                            targets: [12,13],
                            visible: false
                        }
                      ],
                    deferRender: true,
                    drawCallback: function(){
                        renderComplete.resolve();
                    }.bind(this)
                } );
                return renderComplete;
            },
            getVariantCount: function(){
                let deepCopyQuery = JSON.parse(JSON.stringify(this.baseQuery));
                deepCopyQuery.query.expectedResultType="VARIANT_COUNT_FOR_QUERY";
                return $.ajax({
                    url: window.location.origin + "/picsure/query/sync",
                    type: 'POST',
                    headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                    contentType: 'application/json',
                    data: JSON.stringify(deepCopyQuery),
                    dataType: 'text',
                    success: function(response){
                        if (response) {
                            let responseJson = JSON.parse(response);
                            if (responseJson.count !== undefined) {
                                this.variantCount = responseJson.count;
                                $(this.modalTitleSelector).html("Variant Data: " + (responseJson.count) + " variants found");
                                return;
                            }
                        }
                    }.bind(this),
                    error: function(response){
                        this.handleDataError(this.dataErrorMsg);
                    }.bind(this)
                });
            },
            getVariantData: function(){
                let deepCopyQuery = JSON.parse(JSON.stringify(this.baseQuery));
                if (settings.variantExplorerStatus === config.VariantExplorerStatusEnum.enabled) {
                    deepCopyQuery.query.expectedResultType="VCF_EXCERPT";
                } else if (settings.variantExplorerStatus === config.VariantExplorerStatusEnum.aggregate) {
                    deepCopyQuery.query.expectedResultType="AGGREGATE_VCF_EXCERPT";
                } else {
                    throw "variantExplorerStatus must be enabled or aggregate";
                }
                return $.ajax({
                    url: window.location.origin + "/picsure/query/sync",
                    type: 'POST',
                    headers: {"Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token},
                    contentType: 'application/json',
                    data: JSON.stringify(deepCopyQuery),
                    dataType: 'text',
                    success: function(response){
                        let output = {};
                        if(response.length > 0){
                            //each line is TSV
                            let lines = response.split("\n");
                            headers = lines[0].split("\t");
                            output["headers"] = headers; 
                            output["variants"] = [];
                            //read the tsv lines into an object that we can sent to Handlebars template
                            for(i = 1; i < lines.length; i++){
                                values = lines[i].split("\t");
                                if(values.length > 1){
                                    output["variants"].push(values);
                                }
                            }
                            output = this.reorderColumns(output);
                        }
                        this.variantData = output;
                    }.bind(this),
                    error: function(response){
                        this.handleDataError(this.dataErrorMsg);
                    }.bind(this),
                });
            },
            handleDataError: function(errorMsg){
                if (errorMsg) {
                    this.$el.html('<div class="variant-exporer-error"><i class="fa fa-TODO"></i><p>'+errorMsg+'</p><div>');
                } else {
                    this.$el.html('<div class="variant-exporer-error"><i class="fa fa-TODO"></i><h4>Data failed to load</h4><br><p>'+errorMsg+'</p><div>');
                }
            },
            handleSiteDisabled: function(){
                this.$el.html('<div class="variant-exporer-error"><i class="fa fa-TODO"></i><h4>There is no data to display</h4><br><h5>The Variant Explorer is not enabled for this site</h5><div>');
            },
            reorderColumns: function(input){
                const headersToMoveInOrder = ['CHROM', 'POSITION', 'REF', 'ALT', 'Patients with this variant in subset', 'Patients with this variant NOT in subset', 'Variant_consequence_calculated', 'Gene_with_variant', 'Variant_class', 'Variant_severity', 'Variant_frequency_in_gnomAD', 'Variant_frequency_as_text', 'AC', 'AN'];
                // Create a map of header indexes for quick lookup
                const headerIndexMap = {};
                input.headers.forEach((header, index) => {
                    headerIndexMap[header] = index;
                });
                const reorderedHeaders = headersToMoveInOrder.concat(input.headers.filter(header => !headersToMoveInOrder.includes(header)));
                //variants is an array of arrays so we need to reorder each variant array
                const reorderedVariants = input.variants.map(variant => {
                    const reorderedVariant = [];
                    reorderedHeaders.forEach(header => {
                        const headerIndex = headerIndexMap[header];
                        if (headerIndex !== undefined) {
                            reorderedVariant.push(variant[headerIndex]);
                        }
                    });
                    return reorderedVariant;
                });

                return output = {
                    headers: reorderedHeaders,
                    variants: reorderedVariants
                };
            },
            render: function() {
                this.$el.html(this.variantTableTemplate());
                let loading = this.getVariantCount().then(() => {
                    if (this.variantCount > maxVariantCount) {
                        this.handleDataError('Too many variants!  Found ' + this.variantCount + ', but cannot display more than ' + settings.maxVariantCount + ' variants.');
                    } else {
                        return this.getVariantData().then((response) => {
                            if (settings.queryExportType && settings.queryExportType !== "EXPORT_DISABLED") {
                                createDownloadLink(response, this.modalHeaderSelector);
                            }
                            return this.createDataTable();
                        });
                    }
                });
                spinner.medium(loading, "#variant-spinner", "spinner-medium spinner-medium-center");
            }
        });
        return variantExplorerView;
    }
);