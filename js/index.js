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

let programTypeChart;
let commonUniPieChart;
let yearLineChart;

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
    $('#main-table').DataTable({
        columns: [{
                title: "Title"
            },
            {
                title: "University"
            },
            {
                title: "Major　"
            },
            {
                title: "GPA"
            },
            {
                title: "Admission Programs"
            },
            {
                title: "Date"
            },
            {
                title: '<span data-toggle="tooltip" title="How well this article matches your query">Score <i class="fas fa-info-circle"></i></span>'
            },
            {
                title: "Link"
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
    let $datatable = $('#main-table');

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

                $datatable.DataTable().clear().rows.add(result).draw();


                // Histogram chart
                var ctx = document.getElementById("histogramChart").getContext('2d');
                if (programTypeChart) {
                    programTypeChart.destroy();
                }
                programTypeChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(program_type_counter),
                        datasets: [{
                            label: '# of posts',
                            data: Object.values(program_type_counter),
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.2)',
                                'rgba(54, 162, 235, 0.2)',
                                'rgba(255, 206, 86, 0.2)',
                                'rgba(75, 192, 192, 0.2)',
                                'rgba(153, 102, 255, 0.2)',
                                'rgba(255, 159, 64, 0.2)'
                            ],
                            borderColor: [
                                'rgba(255,99,132,1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 206, 86, 1)',
                                'rgba(75, 192, 192, 1)',
                                'rgba(153, 102, 255, 1)',
                                'rgba(255, 159, 64, 1)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true
                                }
                            }]
                        }
                    }
                });

                // Pie Chart
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
                if (commonUniPieChart) {
                    commonUniPieChart.destroy();
                }
                commonUniPieChart = new Chart(ctxP, {
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
                        legend: screen.width < 1440 ? false : {
                            position: 'bottom'
                        },
                        scales: {
                            xAxes: [{
                                ticks: {
                                    beginAtZero: true
                                }
                            }]
                        }
                    }
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
                    scrollTop: '+=640px'
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