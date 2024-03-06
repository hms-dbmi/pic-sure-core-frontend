define([ "underscore", "overrides/dataset/utilities" ],  function(_, overrides){
    const titleRegex = /(\\[^\\]+)*\\(?<title>[^\\]+)\\/;
    function anyRecordOf(filters = []){
        return filters.map(filter => titleRegex.exec(filter).groups).map(({title}) => title);
    }
    function commonPrefix(concepts){
        if(concepts.length == 0) return "";
        else if (concepts.length == 1) return concepts[0];

        function commonPrefixUtil(a, b){
            let prefix = "";
            for(let i = 0, j = 0; i <= a.length - 1 && j <= b.length - 1; i++, j++) {
                if(a[i] != b[j]) break;
                prefix += a[i];
            }
            return prefix;
        }

        return concepts.reduce((prefix, concept) => {
            if(!prefix) return concept;
            return commonPrefixUtil(prefix, concept);
        }, "");
    }
    const format = {
        anyRecordOf: function(filters = []){
            return filters.length > 0 ? [{
                title: "Any record of",
                values: anyRecordOf(filters)
            }] : [];
        },
        anyRecordOfMulti: function(filters = []){
            if(filters.length === 0) return;
            const prefixes = filters.map(commonPrefix)
            return anyRecordOf(prefixes).map(value => ({
                title: "Any record of",
                values: [ value ]
            }));
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
        categoryVariantOrCategory: function(filters = {}) {
            const filtersList = Object.entries(filters);
            return filtersList.map(([ filter, values ]) => {
                if (filter.match(titleRegex)) {
                    const { title } = titleRegex.exec(filter).groups;
                    return { title, values };
                } else {
                    return { title: filter.replaceAll("_", " "), values };
                }
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