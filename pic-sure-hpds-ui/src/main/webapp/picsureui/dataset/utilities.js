define([ "overrides/dataset/utilities" ],  function(overrides){
    const titleRegex = /(\\[^\\]+)*\\(?<title>[^\\]+)\\/;
    const format = {
        categories: function(filters = {}) {
            const filtersList = Object.entries(filters);
            return filtersList.map(([ filter, values ]) => {
                const { title } = titleRegex.exec(filter).groups;
                return { title, values }
            });
        },
        numeric: function(filters = {}) {
            const filtersList = Object.entries(filters);
            return filtersList.map(([ filter, { min, max } ]) => {
                const { title } = titleRegex.exec(filter).groups;
                return { title, range: { min, max } };
            });
        },
        categoryVariant: function(filter = {}){
            const {
                Gene_with_variant: gene = [],
                Variant_consequence_calculated: consequenceList = [],
                Variant_frequency_as_text: frequency = []
            } = filter;
            const filtersList = [];
            if(gene.length > 0){
                filtersList.push({ title: `Gene${gene.length > 1 ? 's' : ''} with Variant`, values: gene });
            }
            if(frequency.length > 0){
                filtersList.push({ title: 'Variant Frequency', values: frequency });
            }
            if(consequenceList.length > 0){
                filtersList.push({ title: 'Calculated Variant Consequence', values: consequenceList });
            }
            return filtersList;
        },
        numericVariant: function(filters = {}) {
            const filtersList = Object.entries(filters);
            return filtersList.map(([ title, { min, max } ]) => {
                return { title, range: { min, max } };
            });
        },
        selectedVariables: function(variables = []) {
            return Object.entries(
                variables.reduce(( map, variable ) => {
                    const { path, field } = /(\\(?<path>.+))?\\(?<field>[^\\]+)\\/.exec(variable).groups;
                    if(path){
                        const values = map[path] || [];
                        return { ...map, [path]: [ ...values, field] };
                    } else {
                        return { ...map, [field]: [] };
                    }
                }, {})
            ).map(([ filter, values ]) =>{
                const { title } = /([^\\]+\\)*(?<title>[^\\]+)/.exec(filter).groups;
                return { title, values };
            });
        },
        ...overrides.format
    };
    function buildRange({ min, max }) {
        const rangeList = [];
        min && rangeList.push(`Min: ${min}`);
        max && rangeList.push(`Max: ${max}`);
        return rangeList;
    };
    const render = {
        html: function(list, valuesPrefix = ''){
            return list.map((item) => {
                const { title, range } = item;
                const values = range ? buildRange(range) : item.values;
                if (values.length > 0){
                    return `<span class="list-title">${title}:</span> ${valuesPrefix}${values.join(", ")}`;
                } else {
                    return `<span class="list-title">${title}</span>`;
                }
            });
        },
        string: function(list, valuesPrefix = ''){
            return list.map((item) => {
                const { title, range } = item;
                const values = range ? item.values : buildRange(range);
                return `${title}: ${valuesPrefix}${values.join(', ')}`;
            });
        },
        ...overrides.render
    }
    return { format, render };
});