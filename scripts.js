let csvData = null;
let currentAgentID = null;
let charts = [];

document.getElementById('csvFileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        document.querySelector('.custom-file-label').textContent = file.name;
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            complete: function(results) {
                console.log(results.data);
                csvData = results.data;
                createCharts(csvData);
            }
        });
    }
});

document.getElementById('submitButton').addEventListener('click', function() {
    if (csvData) {
        createCharts(csvData);
    } else {
        alert('Please upload a CSV file first.');
    }
});

function createCharts(data) {
    const agents = data.map(row => row['AgentID']);
    const speechScores = data.map(row => row['SpeechScore']);
    const wpm = data.map(row => row['AvgWordsPerMinute']);
    const spm = data.map(row => row['AvgSyllablesPerMinute']);
    const sentiments = data.map(row => row['Sentiment']);
    const clarity = data.map(row => row['CallClarity']);
    const enthusiasm = data.map(row => row['AgentEnthusiasm']);
    const empathy = data.map(row => row['AgentEmpathy']);
    const durations = data.map(row => row['CallDuration']);

    charts = [
        createGaugeChart('gaugeChart', agents, speechScores),
        createBarChart('wpmChart', agents, wpm, 'Average Words per Minute'),
        createBarChart('spmChart', agents, spm, 'Average Syllables per Minute'),
        createPieChart('sentimentChart', agents, sentiments),
        createLineChart('clarityChart', agents, clarity, 'Call Clarity'),
        createBarChart('enthusiasmChart', agents, enthusiasm, 'Agent Enthusiasm'),
        createBarChart('empathyChart', agents, empathy, 'Agent Empathy'),
        createHistogram('durationChart', agents, durations, 'Call Duration')
    ];
}

function createGaugeChart(id, labels, data) {
    const ctx = document.getElementById(id).getContext('2d');
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: data.map((_, i) => getBackgroundColor(labels[i])),
                borderColor: data.map((_, i) => getBorderColor(labels[i])),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                }
            }
        }
    });
}

function createBarChart(id, labels, data, label) {
    const ctx = document.getElementById(id).getContext('2d');
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: data.map((_, i) => getBackgroundColor(labels[i])),
                borderColor: data.map((_, i) => getBorderColor(labels[i])),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: {
                        size: 16
                    },
                    bodyFont: {
                        size: 14
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 14
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 14
                        }
                    }
                }
            }
        }
    });
}

function createPieChart(id, labels, data) {
    const sentimentCounts = {
        'Positive': 0,
        'Neutral': 0,
        'Negative': 0
    };

    data.forEach(sentiment => {
        sentimentCounts[sentiment]++;
    });

    const ctx = document.getElementById(id).getContext('2d');
    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(sentimentCounts),
            datasets: [{
                data: Object.values(sentimentCounts),
                backgroundColor: [
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                }
            }
        }
    });
}

function createLineChart(id, labels, data, label) {
    const ctx = document.getElementById(id).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: data.map((_, i) => getBackgroundColor(labels[i])),
                borderColor: data.map((_, i) => getBorderColor(labels[i])),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: {
                        size: 16
                    },
                    bodyFont: {
                        size: 14
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 14
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 14
                        }
                    }
                }
            }
        }
    });
}

function createHistogram(id, labels, data, label) {
    const ctx = document.getElementById(id).getContext('2d');
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: data.map((_, i) => getBackgroundColor(labels[i])),
                borderColor: data.map((_, i) => getBorderColor(labels[i])),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: {
                        size: 16
                    },
                    bodyFont: {
                        size: 14
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 14
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 14
                        }
                    }
                }
            }
        }
    });
}

function getBackgroundColor(label) {
    return currentAgentID && label != currentAgentID ? 'rgba(200, 200, 200, 0.5)' : 'rgba(75, 192, 192, 0.2)';
}

function getBorderColor(label) {
    return currentAgentID && label != currentAgentID ? 'rgba(200, 200, 200, 0.5)' : 'rgba(75, 192, 192, 1)';
}

function downloadChart(id) {
    const link = document.createElement('a');
    link.href = document.getElementById(id).toDataURL('image/png');
    link.download = `${id}.png`;
    link.click();
}
