define([
    "jquery", "backbone", "handlebars", "underscore", "text!dataset/dataset-manage.hbs", "overrides/dataset/dataset-manage",
    "common/spinner", "common/modal", "dataset/dataset-view"
], function(
    $, BB, HBS, _, template, overrides,
    spinner, modal, viewDataset
){
    return BB.View.extend({
        initialize : function(user){
            this.template = HBS.compile(overrides.template ? overrides.template : template);
            this.user = user;
            this.archivedEnabled = false;
        },
        events: {
            "click #toggle-archived-btn": "toggleArchiveView"
        },
        staticColumns: [
            { title: "Dataset ID Name", data: "name" },
            { title: "Dataset ID", data: "uuid" },
            { title: "Created", type: "datetime", data: "query.startTime" },
            { title: "Query ID", data: "query.uuid" },
            { title: "Metadata", data: "metadata" }
        ],
        getColumnsAndActions: function(tableId) {
            const actions = {
                active: [
                    {
                        title: "Copy",
                        name: "copy",
                        style: "alternate",
                        handler: row => {
                            const { uuid } = row.data();
                            const key = "dataset-action-copy-" + uuid?.split("-")[0];
                            navigator.clipboard.writeText(uuid);
                            const originalText = document.getElementById(key).innerText;
                            document.getElementById(key).innerText = "Copied!";

                            // reset after some delay
                            _.delay(() => { document.getElementById(key).innerText = originalText; }, 4500);
                        }
                    },
                    {
                        title: "View",
                        name: "view",
                        style: "alternate",
                        handler: row => {
                            const onClose = (view) => {
                                $(".close").click();
                                row.node().focus();
                            };
                            const onArchive = () => this.archiveRow(true)(row);
                            modal.displayModal(
                                new viewDataset(row.data(), { onClose, onArchive }),
                                "View Dataset",
                                onClose,
                                { width: "40%" }
                            );
                        }
                    },
                    {
                        title: "Archive",
                        name: "archive",
                        style: "action",
                        handler: this.archiveRow(true)
                    }
                ],
                archived: [
                    {
                        title: "Restore",
                        name: "restore",
                        style: "action",
                        handler: this.archiveRow(false)
                    }
                ]
            }[tableId];

            const columns = [ 
                ...this.staticColumns,
                ...actions.map(({title}) => ({title}))
            ];

            const columnDefs = [
                { // format uquery created as date
                    targets: 2,
                    render: seconds => new Date(seconds).toDateString()
                },
                { // hide query id column
                    targets: [3, 4],
                    visible: false
                },
                ...actions.map(({name, style}, index) => ({
                    data: null,
                    render: row => this.renderButton(row.uuid, name, style),
                    targets: this.staticColumns.length + index
                }))
            ];

            const handlers = actions.map(({ name, handler }) => ({ name, handler }));

            return { columns, columnDefs, handlers };
        },
        loadDatasets: function(){
            if (overrides.loadDatasets){
                overrides.loadDatasets(this);
                return;
            }

            spinner.medium(
                $.ajax({
                    url: window.location.origin + "/picsure/dataset/named",
                    type: "GET",
                    headers: { "Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token },
                    contentType: "application/json",
                    dataType: "json",
                    success: function (datasets) {
                        const { false: active = [], true: archived = [] } = _.groupBy(datasets, (dataset) => dataset.archived);
    
                        this.renderTable("active", active);
                        this.renderTable("archived", archived);
                    }.bind(this),
                    error: function (response, status, error) {
                        this.renderError("An error happened during request.", error);
                    }.bind(this)
                }), 
                "#download-spinner", 
                "download-spinner",
            );
        },
        updateDataset: function(uuid, body, handlers){
            if (overrides.updateDataset){
                overrides.updateDataset(uuid, body, handlers, this);
                return;
            }

            const { onSuccess = () => {}, onError = () => {} } = handlers;
            $.ajax({
                url: window.location.origin + "/picsure/dataset/named/" + uuid,
                type: "PUT",
                headers: { "Authorization": "Bearer " + JSON.parse(sessionStorage.getItem("session")).token },
                contentType: "application/json",
                dataType: "json",
                data: JSON.stringify(body),
                success: onSuccess,
                error: onError
            })
        },
        archiveRow: function(archived) {
            return row => {
                const { uuid, query, name, metadata } = row.data();

                const button = `#dataset-action-${archived ? "archive" : "restore"}-` + uuid?.split('-')[0];
                $(button).button("loading");

                const body = { queryId: query.uuid, name, metadata, archived };
                this.updateDataset(uuid, body, {
                    onSuccess: () => {
                        const altTable = $(`#${archived ? "archived" : "active"}-table`).DataTable();
                        altTable.row.add(row.data());
                        altTable.columns.adjust().draw();
                        row.remove().draw();

                        $(button).button("reset");
                    }, 
                    onError: (response, status, error) => {
                        $(button).button("reset");
                        this.renderError("An error happened during request.", error);
                    }
                });
            }
        },
        renderError: function(text, error){
            $("#errors").html(text);
            $("#errors").removeClass("hidden");
            console.log(error);
        },
        renderButton: function(uuid, type, style){
            const key = "dataset-action-" + type + "-" + uuid?.split("-")[0];
            const styles = ["btn btn-default", "action-" + type, style ].join(" ");
            return  `<button id="${key}" class="${styles}" data-loading-text="` +
                `<span class='glyphicon glyphicon glyphicon-refresh spinning' aria-hidden='true'></span> Loading" ` +
            `aria-label="Left Align">${type}</button>`;
        },
        renderTable: function(tableId, data) {
            if (overrides.renderTable){
                overrides.renderTable(tableId, data, this);
                return;
            }
            const { columns, columnDefs, handlers } = this.getColumnsAndActions(tableId);

            const table = $("#" + tableId + "-table").DataTable({
                data, columns, columnDefs,
                order: [[2, "desc"]] // order by created date
            });

            handlers.forEach(({name, handler}) => {
                table.on("click", "button.action-" + name, event => {
                    handler(table.row(event.target.closest("tr")));
                });
            });
        },
        toggleArchiveView: function(){
            this.archivedEnabled = !this.archivedEnabled;
            $("#toggle-archived-btn").text((this.archivedEnabled ? "Exclude" : "Include") + " archived Dataset IDs");
            $("#archived")[this.archivedEnabled ? "removeClass" : "addClass"]("hidden");
            this.archivedEnabled && $("#archived-table").DataTable().columns.adjust().draw();
        },
        render: function(){
            this.$el.html(this.template(this));

            this.loadDatasets();

            overrides.renderExt && overrides.renderExt(this);
        }
    });
});