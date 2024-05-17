document.getElementById('generateBtn').addEventListener('click', handleFileSelect, false);

function handleFileSelect() {
    const file = document.getElementById('csvFileInput').files[0];
    Papa.parse(file, {
        header: true,
        complete: function(results) {
            const data = results.data;
            console.log(data);  // Debug: Check the parsed data
            generateDashboard(data);
        }
    });
}

function generateDashboard(data) {
    const years = Array.from(new Set(data.map(row => row.Year)));
    console.log('Years:', years);  // Debug: Check the years
    const totalCallsPerYear = years.map(year => data.filter(row => row.Year === year).reduce((sum, row) => sum + parseInt(row.Calls_Handled || 0), 0));
    const avgHandlingTimePerYear = years.map(year => {
        const filteredData = data.filter(row => row.Year === year);
        const totalHandlingTime = filteredData.reduce((sum, row) => sum + parseFloat(row.Average_Handling_Time || 0), 0);
        return (totalHandlingTime / filteredData.length).toFixed(2);
    });

    document.getElementById('totalCalls').innerText = totalCallsPerYear.reduce((sum, calls) => sum + calls, 0);
    document.getElementById('avgHandlingTime').innerText = (data.reduce((sum, row) => sum + parseFloat(row.Average_Handling_Time || 0), 0) / data.length).toFixed(2) + ' mins';

    const customerSatisfaction = [0, 0, 0, 0, 0];
    data.forEach(row => {
        customerSatisfaction[parseInt(row.Customer_Satisfaction) - 1]++;
    });

    const kpiLabels = ['Listening Skill', 'Clarity of Speech', 'Agent Enthusiasm', 'Agent Empathy'];
    const kpiAverages = kpiLabels.map(kpi => (data.reduce((sum, row) => sum + parseInt(row[kpi.replace(' ', '_')] || 0), 0) / data.length).toFixed(2));

    new Chart(document.getElementById('yearlyPerformanceChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Total Calls Handled',
                    data: totalCallsPerYear,
                    backgroundColor: 'rgba(106, 90, 205, 0.2)', // Light purple
                    borderColor: 'rgba(106, 90, 205, 1)', // Purple
                    borderWidth: 1
                },
                {
                    label: 'Avg Handling Time (mins)',
                    data: avgHandlingTimePerYear,
                    backgroundColor: 'rgba(255, 206, 86, 0.2)', // Light yellow
                    borderColor: 'rgba(255, 206, 86, 1)', // Yellow
                    borderWidth: 1,
                    type: 'line'
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    new Chart(document.getElementById('customerSatisfactionChart').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Very Unsatisfied', 'Unsatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'],
            datasets: [{
                data: customerSatisfaction,
                backgroundColor: ['#e74c3c', '#f39c12', '#f1c40f', '#3498db', '#2ecc71'] // Red, orange, yellow, blue, green
            }]
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return `${tooltipItem.label}: ${tooltipItem.raw}`;
                        }
                    }
                }
            }
        }
    });

    new Chart(document.getElementById('kpiChart').getContext('2d'), {
        type: 'radar',
        data: {
            labels: kpiLabels,
            datasets: [{
                label: 'Average KPI Score',
                data: kpiAverages,
                backgroundColor: 'rgba(52, 152, 219, 0.2)', // Light blue
                borderColor: 'rgba(52, 152, 219, 1)', // Blue
                borderWidth: 1
            }]
        }
    });

    new Chart(document.getElementById('handlingTimeChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Avg Handling Time (mins)',
                data: avgHandlingTimePerYear,
                backgroundColor: 'rgba(231, 76, 60, 0.2)', // Light red
                borderColor: 'rgba(231, 76, 60, 1)', // Red
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
