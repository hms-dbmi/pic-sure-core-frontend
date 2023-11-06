define([ "underscore", "overrides/dataset/utilities" ],  function(_, overrides){
    const titleRegex = /(\\[^\\]+)*\\(?<title>[^\\]+)\\/;
    function anyRecordOf(filters = []){
        return filters.map(filter => titleRegex.exec(filter).groups);
    }
    const format = {
        anyRecordOf,
        anyRecordOfMulti: function(filters = []){
            return _.flatten(filters.map(filter => anyRecordOf(filter)));
        },
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
        categoryVariant: function(filters = {}){
            const filtersList = Object.entries(filters);
            return filtersList.map(([ title, values ]) => {
                return { title: title.replaceAll("_", " "), values };
            });
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
                if (values && values.length > 0){
                    return `<span class="list-title">${title}:</span> ${valuesPrefix}${values.join(", ")}`;
                } else {
                    return `<span class="list-title">${title}</span>`;
                }
            });
        },
        string: function(list, valuesPrefix = ''){
            return list.map((item) => {
                const { title, range } = item;
                const values = range ? buildRange(range) : item.values;
                if (values && values.length > 0){
                    return `${title}: ${valuesPrefix}${values.join(', ')}`;
                } else {
                    return title;
                }
            });
        },
        ...overrides.render
    }
    return { format, render };
});