/*
-------------------------------------------------
File Name:     index.js
Description:   API scripts and listeners initialization
                    for each page
Author:        Alvin Hou
-------------------------------------------------
*/
const API_URL = 'https://ptt-studyabroad-api.herokuapp.com/admission';
// const API_URL = 'http://127.0.0.1:8000/admission';

const placeholder_str = `<span> - </span>`;

const mdColors = [
    '#ef9a9a',
    '#ce93d8',
    '#9fa8da',
    '#90caf9',
    '#80deea',
    '#a5d6a7',
    '#e6ee9c',
    '#ffe082',
    '#ffab91',
    '#80cbc4'
];

let programHorizontalChart;
let uniHorizontalChart;
let yearLineChart;
let dataTable;

let sort_dict = (dict, sort_by = 'key', reverse = false) => {
    let items = Object.keys(dict).map(function (key) {
        return [key, dict[key]];
    });
    if (sort_by == 'value') {
        // Sort the array based on the second element
        items.sort(function (first, second) {
            return reverse ? second[1] - first[1] : first[1] - second[1];
        });
    } else {
        items.sort(function (first, second) {
            return reverse ? second[0] - first[0] : first[0] - second[0];
        });
    }
    return items;
}

$(document).ready(() => {
    $('.selectpicker').multiselect();
    dataTable = $('#main-table').DataTable({
        columns: [{
                title: "Title",
                width: "25%"
            },
            {
                title: "University",
                width: "7%"
            },
            {
                title: "Major　",
                width: "7%"
            },
            {
                title: "GPA",
                width: "7%"
            },
            {
                title: "Admission Programs",
                width: "42%"
            },
            {
                title: "Date",

                width: "5%"
            },
            {
                title: '<span data-toggle="tooltip" title="How well this article matches your query">Score <i class="fas fa-info-circle"></i></span>',
                width: "7%"
            },
            {
                title: "Link",
                width: "5%"
            }
        ],
        order: [],
        lengthMenu: [
            [15, 25, 50, -1],
            [15, 25, 50, "All"]
        ],
        pageSize: 15,
        scrollX: true
    });
    $('.dataTables_length').addClass('bs-select');

    // Example Button click listener
    $('#ex-btn1').click((e) => {
        $("#target_schools").tagsinput('add', 'CMU');
        $("#target_schools").tagsinput('add', 'CMU-SV');
        let program_arr = ['MSIN', 'MSIS', 'MHCI', 'MITS', 'MSIT', 'MSSE', 'MCDS', 'MSML', 'MSR', 'MSCV', 'MISM', 'LTI', 'ETC', 'MSIT-MOB', 'METALS'];
        program_arr.forEach(e => {
            $("#target_programs").tagsinput('add', e);
        })
        setTimeout(() => {
            $('#api-btn').click();
        }, 800);
    });


    // API Button click listener
    $('#api-btn').click((e) => {
        $('#search-spinner').removeClass('hidden');
        $('#search-icon').hide();
        let university = $('#university').val();
        let major = $('#major').val();
        let gpa = $('#gpa').val();
        let target_schools = $("#target_schools").tagsinput('items');
        let target_programs = $("#target_programs").tagsinput('items');
        let program_types = $("#program_types").val();
        let program_level = $("#program_level").val();

        let query = {
            "university": university,
            "major": major,
            "gpa": gpa ? parseFloat(gpa) : 0,
            "target_schools": target_schools,
            "target_programs": target_programs,
            "program_types": program_types,
            "program_level": program_level
        }

        let program_type_counter = new Proxy({}, {
            get: (target, name) => name in target ? target[name] : 0
        });
        let university_counter = new Proxy({}, {
            get: (target, name) => name in target ? target[name] : 0
        });
        let university_program_counter = new Proxy({}, {
            get: (target, name) => name in target ? target[name] : 0
        });
        let year_counter = new Proxy({}, {
            get: (target, name) => name in target ? target[name] : 0
        });

        console.log(query);

        $.ajax({
            type: "POST",
            url: API_URL,
            data: JSON.stringify(query),
            dataType: "json",
            crossDomain: true,
            success: (data) => {
                $('#search-spinner').addClass('hidden');
                $('#search-icon').show();

                console.log(data);

                let result = [];
                data.forEach(article => {

                    let title_str = `<a href=${article.url} target="_blank" > <span class="font-weight-bolder">${article.article_title} </span> </a>`;

                    let date = new Date(article.date);
                    let date_str = String(date.getFullYear()) + '/' + String(date.getMonth() + 1) + '/' + String(date.getDate() + 1);
                    year_counter[date.getFullYear()] += 1;


                    // Insert University
                    let university_str = placeholder_str;
                    if (article.university) {
                        university_str = `<span> ${article.university} <span class="font-weight-bold">/</span> ${article.university_cabbr} </span>`
                    }
                    // Insert Major
                    let major_str = placeholder_str;
                    if (article.major) {
                        major_str = `<span> ${article.major} <span class="font-weight-bold">/</span> ${article.major_cabbr} </span>`;
                    }

                    // Insert GPA
                    let gpa_str = placeholder_str;
                    if (article.gpa >= 0) {
                        if (article.gpa_scale > 0) {
                            gpa_str = `<span> ${article.gpa} / ${article.gpa_scale} </span>`;
                        } else {
                            gpa_str = `<span> ${article.gpa} </span>`;
                        }
                    }
                    // Normalize Admission University String
                    let programs = [];
                    article.admission_programs.forEach(ad_program => {
                        if (ad_program.program_level != 'PhD') {
                            programs.push(`<span class="font-weight-bolder">${ad_program.university}</span> - <span class="f">${ad_program.program}</span>`);
                        } else {
                            programs.push(`<span class="font-weight-bolder">${ad_program.university}</span> - <span class="">${ad_program.program} PhD</span>`);
                        }
                        if (ad_program.program_type) {
                            program_type_counter[ad_program.program_type] += 1;
                        }
                        if (ad_program.university) {
                            university_counter[ad_program.university] += 1
                        }
                        if (ad_program.program && ad_program.university) {
                            university_program_counter[ad_program.university + '@' + ad_program.program] += 1;
                        }
                    });
                    let ad_str = programs.join('<br>');

                    let score_str = article.score;
                    let link_str = `<a href=${article.url} target="_blank"><i class="fas fa-external-link-alt"></i></a>`;

                    let row = [
                        title_str, university_str, major_str, gpa_str,
                        ad_str, date_str, score_str, link_str
                    ];

                    result.push(row);

                });

                dataTable.clear().rows.add(result).search('').draw();


                // Bar chart
                var ctx = document.getElementById("horizontalProgramBarChart").getContext('2d');
                ctx.height = 800;
                if (programHorizontalChart) {
                    programHorizontalChart.destroy();
                }
                let uni_program_items = sort_dict(university_program_counter, sort_by = 'value', reverse = true);
                // Get top 10 popular programs
                uni_program_items = uni_program_items.slice(0, 10);
                // Get labels and count for universities 
                let uni_program_labels = uni_program_items.map(pair => {
                    return pair[0]
                });
                let uni_program_counts = uni_program_items.map(pair => {
                    return pair[1]
                });

                programHorizontalChart = new Chart(ctx, {
                    type: 'horizontalBar',
                    data: {
                        labels: uni_program_labels,
                        datasets: [{
                            label: '# of posts',
                            data: uni_program_counts,
                            backgroundColor: mdColors,
                            borderColor: mdColors,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: window.innerWidth >= 1600,
                        legend: window.innerWidth < 1600 ? false : {
                            position: 'bottom'
                        },
                        scales: {
                            xAxes: [{
                                ticks: {
                                    beginAtZero: true,

                                }
                            }],
                            yAxes: [{
                                ticks: {
                                    callback: function (value, index, values) {
                                        return value.split('@')
                                    }
                                }
                            }],
                        },
                        title: {
                            display: true,
                            text: 'Click the bars to filter programs',
                            fontFamily: 'Roboto',
                            fontStyle: 'Normal',
                            fontSize: 12
                        },
                        onClick: function (e, items) {
                            if (items.length == 0) return; //Clicked outside any bar.
                            let uni = items[0]._model.label;
                            uni = uni.replace('@', ' - ');
                            dataTable.search(uni, true, false).draw();
                        },
                        hover: {
                            onHover: function (e) {
                                var point = this.getElementAtEvent(e);
                                if (point.length) e.target.style.cursor = 'pointer';
                                else e.target.style.cursor = 'default';
                            }
                        }
                    }
                });

                // horizontal Chart
                let ctxP = document.getElementById("horizontalBarChart");
                // Create uni_items array
                let uni_items = sort_dict(university_counter, sort_by = 'value', reverse = true);
                // Get top 10 popular admission universities
                uni_items = uni_items.slice(0, 10);
                // Get labels and count for universities 
                let uni_labels = uni_items.map(pair => {
                    return pair[0]
                });
                let uni_counts = uni_items.map(pair => {
                    return pair[1]
                });
                if (uniHorizontalChart) {
                    uniHorizontalChart.destroy();
                }
                uniHorizontalChart = new Chart(ctxP, {
                    type: 'horizontalBar',
                    data: {
                        labels: uni_labels,
                        datasets: [{
                            label: '# of posts',
                            data: uni_counts,
                            backgroundColor: mdColors,
                            hoverBackgroundColor: mdColors
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: window.innerWidth >= 1600,
                        legend: window.innerWidth < 1600 ? false : {
                            position: 'bottom'
                        },
                        scales: {
                            xAxes: [{
                                ticks: {
                                    beginAtZero: true
                                }
                            }]
                        },
                        title: {
                            display: true,
                            text: 'Click the bars to filter universities',
                            fontFamily: 'Roboto',
                            fontStyle: 'Normal',
                            fontSize: 12
                        },
                        onClick: function (e, items) {
                            if (items.length == 0) return; //Clicked outside any bar.
                            uni = items[0]._model.label;
                            dataTable.search(uni).draw();
                        },
                        hover: {
                            onHover: function (e) {
                                var point = this.getElementAtEvent(e);
                                if (point.length) e.target.style.cursor = 'pointer';
                                else e.target.style.cursor = 'default';
                            }
                        }
                    },

                });


                // Year line chart
                var ctxL = document.getElementById("lineChart").getContext('2d');
                // Create uni_items array
                let year_items = sort_dict(year_counter, sort_by = 'key');
                // Get labels and count for universities 
                let year_labels = year_items.map(pair => {
                    return pair[0]
                });
                let year_counts = year_items.map(pair => {
                    return pair[1]
                });
                if (yearLineChart) {
                    yearLineChart.destroy();
                }
                yearLineChart = new Chart(ctxL, {
                    type: 'line',
                    data: {
                        labels: year_labels,
                        datasets: [{
                            label: "# of posts",
                            backgroundColor: [
                                'rgba(54, 162, 235, 0.2)',
                            ],
                            borderColor: [
                                'rgba(54, 162, 235, 0.5)',
                            ],
                            borderWidth: 2,
                            data: year_counts
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: window.innerWidth >= 1600,
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true
                                }
                            }]
                        }
                    }
                });
                $('#chart_row').removeClass('hidden');
                $('html, body').animate({
                    scrollTop: '+=500px'
                }, 500);
            },
            error: (xhr) => {
                $('#search-spinner').addClass('hidden');
                $('#search-icon').show();
                console.log(xhr);
            }
        });
    });
});