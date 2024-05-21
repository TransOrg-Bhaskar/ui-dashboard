import React, { useState, useEffect, useMemo } from 'react';
import { Container, AppBar, Toolbar, Typography, Button, Grid, Card, CardContent, TextField, MenuItem, Select, FormControl, InputLabel, Paper, Box } from '@mui/material';
import { Line, Radar, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, CategoryScale, RadialLinearScale, BarElement, Tooltip, Legend, ArcElement, TimeScale } from 'chart.js';
import Papa from 'papaparse';
import 'chartjs-adapter-date-fns';

ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, RadialLinearScale, BarElement, Tooltip, Legend, ArcElement, TimeScale);

const dataLabelsPlugin = {
  id: 'dataLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, index) => {
      const meta = chart.getDatasetMeta(index);
      if (!meta.hidden) {
        meta.data.forEach((element, dataIndex) => {
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
          const fontSize = 12;
          const fontStyle = 'normal';
          const fontFamily = 'Helvetica Neue';
          ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`;
          const dataString = dataset.data[dataIndex].toString();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const padding = 10;  // Increased padding to prevent collision
          const position = element.tooltipPosition();
          ctx.fillText(dataString, position.x, position.y - (fontSize / 2) - padding);
        });
      }
    });
  }
};

function App() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [timeFilter, setTimeFilter] = useState('Last 7 days');
  const [levelFilter, setLevelFilter] = useState('Enterprise');
  const [levelValue, setLevelValue] = useState('');

  useEffect(() => {
    fetch('/agent_calls_kpi_dashboard.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          complete: results => {
            console.log("Parsed CSV Data:", results.data);
            setData(results.data);
          },
        });
      })
      .catch(error => console.error('Error fetching CSV:', error));
  }, []);

  const applyFilters = () => {
    let filtered = data;

    // Time filter
    const now = new Date();
    let startDate;
    switch (timeFilter) {
      case 'Last 7 days':
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case 'Last 1 Month':
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        break;
      case 'Last 1 Year':
        startDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
        break;
      case 'Last 5 Years':
        startDate = new Date(now.getTime() - (5 * 365 * 24 * 60 * 60 * 1000));
        break;
      default:
        startDate = new Date('1970-01-01');
    }

    console.log("Filtering from date:", startDate);

    filtered = filtered.filter(d => {
      const callDate = new Date(d.CallDate);
      console.log("CallDate:", callDate, ">= StartDate:", startDate, ":", callDate >= startDate);
      return callDate >= startDate;
    });

    // Level filter
    if (levelFilter === 'Team') {
      filtered = filtered.filter(d => d.TeamID === levelValue);
    } else if (levelFilter === 'Agent') {
      filtered = filtered.filter(d => d.AgentID === levelValue);
    }

    console.log("Filtered Data:", filtered);
    setFilteredData(filtered);
  };

  const calculateAverage = (values) => {
    const sum = values.reduce((acc, value) => acc + value, 0);
    return sum / values.length;
  };

  const kpiData = useMemo(() => {
    if (!filteredData.length) return null;

    const aggregatedData = {};

    filteredData.forEach(d => {
      const date = new Date(d.CallDate).toISOString().split('T')[0];
      if (!aggregatedData[date]) {
        aggregatedData[date] = {
          CallSentiment: [],
          AgentEnthusiasm: [],
          Empathy: []
        };
      }
      aggregatedData[date].CallSentiment.push(parseFloat(d.CallSentiment));
      aggregatedData[date].AgentEnthusiasm.push(parseFloat(d.AgentEnthusiasm));
      aggregatedData[date].Empathy.push(parseFloat(d.Empathy));
    });

    const labels = Object.keys(aggregatedData).sort();
    const callSentimentData = labels.map(label => calculateAverage(aggregatedData[label].CallSentiment));
    const agentEnthusiasmData = labels.map(label => calculateAverage(aggregatedData[label].AgentEnthusiasm));
    const empathyData = labels.map(label => calculateAverage(aggregatedData[label].Empathy));

    return {
      labels,
      datasets: [
        {
          label: 'Call Sentiment',
          data: callSentimentData,
          borderColor: '#ff6f00',
          backgroundColor: 'rgba(255, 111, 0, 0.2)',
          fill: false,
          tension: 0.4
        },
        {
          label: 'Agent Enthusiasm',
          data: agentEnthusiasmData,
          borderColor: '#f7931e',
          backgroundColor: 'rgba(247, 147, 30, 0.2)',
          fill: false,
          tension: 0.4
        },
        {
          label: 'Empathy',
          data: empathyData,
          borderColor: '#e74c3c',
          backgroundColor: 'rgba(231, 76, 60, 0.2)',
          fill: false,
          tension: 0.4
        }
      ]
    };
  }, [filteredData]);

  const radarData = useMemo(() => {
    if (!filteredData.length) return null;

    return {
      labels: ['Call Sentiment', 'Agent Enthusiasm', 'Empathy', 'Rude Behaviour', 'Identified Customer', 'Accurate Info', 'Call Clarity'],
      datasets: [
        {
          label: 'KPI Scores',
          data: [
            calculateAverage(filteredData.map(d => parseFloat(d.CallSentiment))),
            calculateAverage(filteredData.map(d => parseFloat(d.AgentEnthusiasm))),
            calculateAverage(filteredData.map(d => parseFloat(d.Empathy))),
            calculateAverage(filteredData.map(d => d.RudeBehaviour === 'true' ? 1 : 0)),
            calculateAverage(filteredData.map(d => d.IdentifiedCustomer === 'true' ? 1 : 0)),
            calculateAverage(filteredData.map(d => d.AccurateInfo === 'true' ? 1 : 0)),
            calculateAverage(filteredData.map(d => parseFloat(d.CallClarity))),
          ],
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  }, [filteredData]);

  const barData = useMemo(() => {
    if (!filteredData.length) return null;

    const trueCounts = {
      'Rude Behaviour': filteredData.filter(d => String(d.RudeBehaviour).toLowerCase() === 'true').length,
      'Identified Customer': filteredData.filter(d => String(d.IdentifiedCustomer).toLowerCase() === 'true').length,
      'Accurate Info': filteredData.filter(d => String(d.AccurateInfo).toLowerCase() === 'true').length,
    };

    const falseCounts = {
      'Rude Behaviour': filteredData.filter(d => String(d.RudeBehaviour).toLowerCase() === 'false').length,
      'Identified Customer': filteredData.filter(d => String(d.IdentifiedCustomer).toLowerCase() === 'false').length,
      'Accurate Info': filteredData.filter(d => String(d.AccurateInfo).toLowerCase() === 'false').length,
    };

    return {
      labels: ['Rude Behaviour', 'Identified Customer', 'Accurate Info'],
      datasets: [
        {
          label: 'True',
          data: [trueCounts['Rude Behaviour'], trueCounts['Identified Customer'], trueCounts['Accurate Info']],
          backgroundColor: 'rgba(255, 111, 0, 0.6)',
          borderColor: 'rgba(255, 111, 0, 1)',
          borderWidth: 1
        },
        {
          label: 'False',
          data: [falseCounts['Rude Behaviour'], falseCounts['Identified Customer'], falseCounts['Accurate Info']],
          backgroundColor: 'rgba(247, 147, 30, 0.6)',
          borderColor: 'rgba(247, 147, 30, 1)',
          borderWidth: 1
        }
      ]
    };
  }, [filteredData]);

  const getColorForValue = (value) => {
    if (value >= 0.75) return '#27ae60';
    if (value >= 0.5) return '#f39c12';
    return '#e74c3c';
  };

  const createGaugeData = (value) => ({
    labels: ['Filled', 'Empty'],
    datasets: [
      {
        data: [value, 1 - value],
        backgroundColor: [
          getColorForValue(value),
          '#e0e0e0'
        ],
        hoverBackgroundColor: [
          getColorForValue(value),
          '#e0e0e0'
        ],
        borderWidth: 0,
      }
    ],
  });

  const gaugeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '80%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    }
  };

  return (
    <Box sx={{ padding: '20px', backgroundColor: '#f3f4f6', boxShadow: 3 }}>
      <Container sx={{ backgroundColor: '#ffffff', padding: '20px', boxShadow: 3, borderRadius: '8px' }}>
        <AppBar position="static" sx={{ backgroundColor: '#ff6f00', height: '150px', justifyContent: 'center', boxShadow: 'none', borderRadius: '8px 8px 0 0' }}>
          <Toolbar sx={{ justifyContent: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img src="logo.png" alt="Company Logo" style={{ width: '150px', marginRight: '15px' }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: '2rem', textAlign: 'center' }}>ICICI Lombard - KPI Dashboard</Typography>
            </Box>
          </Toolbar>
        </AppBar>
        <Box sx={{ margin: '20px 0', padding: '20px', backgroundColor: '#ffecd1', borderRadius: '0 0 8px 8px', boxShadow: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Time Filter</InputLabel>
                <Select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} label="Time Filter">
                  <MenuItem value={'Last 7 days'}>Last 7 days</MenuItem>
                  <MenuItem value={'Last 1 Month'}>Last 1 Month</MenuItem>
                  <MenuItem value={'Last 1 Year'}>Last 1 Year</MenuItem>
                  <MenuItem value={'Last 5 Years'}>Last 5 Years</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Level Filter</InputLabel>
                <Select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} label="Level Filter">
                  <MenuItem value={'Enterprise'}>Enterprise</MenuItem>
                  <MenuItem value={'Team'}>Team</MenuItem>
                  <MenuItem value={'Agent'}>Agent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label={levelFilter === 'Enterprise' ? 'Enterprise ID' : levelFilter === 'Team' ? 'Team ID' : 'Agent ID'}
                value={levelValue}
                onChange={(e) => setLevelValue(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3} display="flex" alignItems="center" justifyContent="center">
              <Button variant="contained" color="primary" onClick={applyFilters} sx={{ backgroundColor: '#ff6f00', height: '56px', width: '100%' }}>Go</Button>
            </Grid>
          </Grid>
        </Box>
        <Grid container spacing={3} sx={{ marginBottom: '40px' }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ backgroundColor: '#ffecd1', boxShadow: 3, borderRadius: '8px', height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ color: '#e74c3c' }}>Call Sentiment</Typography>
                {filteredData.length > 0 && (
                  <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                    <Doughnut data={createGaugeData(filteredData.reduce((sum, d) => sum + parseFloat(d.CallSentiment), 0) / filteredData.length)} options={gaugeOptions} />
                    <Typography variant="h6" sx={{ color: '#27ae60', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                      {(filteredData.reduce((sum, d) => sum + parseFloat(d.CallSentiment), 0) / filteredData.length).toFixed(2)}
                    </Typography>
                  </div>
                )}
                {filteredData.length === 0 && <Typography variant="h6" sx={{ color: '#27ae60', marginTop: '10px' }}>N/A</Typography>}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ backgroundColor: '#ffecd1', boxShadow: 3, borderRadius: '8px', height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ color: '#e74c3c' }}>Agent Enthusiasm</Typography>
                {filteredData.length > 0 && (
                  <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                    <Doughnut data={createGaugeData(filteredData.reduce((sum, d) => sum + parseFloat(d.AgentEnthusiasm), 0) / filteredData.length)} options={gaugeOptions} />
                    <Typography variant="h6" sx={{ color: '#27ae60', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                      {(filteredData.reduce((sum, d) => sum + parseFloat(d.AgentEnthusiasm), 0) / filteredData.length).toFixed(2)}
                    </Typography>
                  </div>
                )}
                {filteredData.length === 0 && <Typography variant="h6" sx={{ color: '#27ae60', marginTop: '10px' }}>N/A</Typography>}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ backgroundColor: '#ffecd1', boxShadow: 3, borderRadius: '8px', height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ color: '#e74c3c' }}>Empathy</Typography>
                {filteredData.length > 0 && (
                  <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                    <Doughnut data={createGaugeData(filteredData.reduce((sum, d) => sum + parseFloat(d.Empathy), 0) / filteredData.length)} options={gaugeOptions} />
                    <Typography variant="h6" sx={{ color: '#27ae60', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                      {(filteredData.reduce((sum, d) => sum + parseFloat(d.Empathy), 0) / filteredData.length).toFixed(2)}
                    </Typography>
                  </div>
                )}
                {filteredData.length === 0 && <Typography variant="h6" sx={{ color: '#27ae60', marginTop: '10px' }}>N/A</Typography>}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Grid container spacing={3} sx={{ marginBottom: '60px' }}>
          <Grid item xs={12} sm={8}>
            <Paper elevation={3} sx={{ padding: '20px', height: '100%' }}>
              <Typography variant="h6">KPI Trend</Typography>
              {kpiData && (
                <Line
                  data={kpiData}
                  options={{
                    scales: {
                      x: {
                        type: 'time',
                        time: {
                          unit: 'day',
                          tooltipFormat: 'MMM dd, yyyy',
                          displayFormats: {
                            day: 'MMM dd, yyyy'
                          }
                        },
                        ticks: {
                          maxTicksLimit: 5,
                          autoSkip: true
                        }
                      }
                    }
                  }}
                />
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper elevation={3} sx={{ padding: '20px', height: '100%' }}>
              <Typography variant="h6">Overall KPI</Typography>
              {radarData && <Radar data={radarData} />}
            </Paper>
          </Grid>
        </Grid>
        <Grid container spacing={3} sx={{ marginBottom: '40px' }}>
          <Grid item xs={12} sm={8}>
            <Paper elevation={3} sx={{ maxHeight: '500px', overflowY: 'auto', padding: '20px' }}>
              <Typography variant="h6">Agent-wise Details</Typography>
              <table style={{ width: '100%', borderSpacing: '0 10px', borderCollapse: 'separate' }}>
                <thead>
                  <tr style={{ backgroundColor: '#ecf0f1', boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.1)' }}>
                    <th style={{ padding: '10px' }}>Agent ID</th>
                    <th style={{ padding: '10px' }}>Call Sentiment</th>
                    <th style={{ padding: '10px' }}>Enthusiasm</th>
                    <th style={{ padding: '10px' }}>Empathy</th>
                    <th style={{ padding: '10px' }}>Rude Behaviour</th>
                    <th style={{ padding: '10px' }}>Identified Customer</th>
                    <th style={{ padding: '10px' }}>Accurate Info</th>
                    <th style={{ padding: '10px' }}>Call Clarity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f5f5f5' : '#fff' }}>
                      <td style={{ padding: '10px' }}>{row.AgentID}</td>
                      <td style={{ padding: '10px', color: getColorForValue(parseFloat(row.CallSentiment)) }}>{row.CallSentiment}</td>
                      <td style={{ padding: '10px', color: getColorForValue(parseFloat(row.AgentEnthusiasm)) }}>{row.AgentEnthusiasm}</td>
                      <td style={{ padding: '10px', color: getColorForValue(parseFloat(row.Empathy)) }}>{row.Empathy}</td>
                      <td style={{ padding: '10px', color: row.RudeBehaviour === 'true' ? '#e74c3c' : '#27ae60' }}>{row.RudeBehaviour}</td>
                      <td style={{ padding: '10px', color: row.IdentifiedCustomer === 'true' ? '#27ae60' : '#e74c3c' }}>{row.IdentifiedCustomer}</td>
                      <td style={{ padding: '10px', color: row.AccurateInfo === 'true' ? '#27ae60' : '#e74c3c' }}>{row.AccurateInfo}</td>
                      <td style={{ padding: '10px', color: getColorForValue(parseFloat(row.CallClarity)) }}>{row.CallClarity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper elevation={3} sx={{ padding: '20px', height: '500px' }}>
              <Typography variant="h6" sx={{ textAlign: 'center', marginBottom: '10px' }}>Distribution of KPI</Typography>
              <div style={{ height: '450px', width: '100%' }}>
                {barData && (
                  <Bar 
                    data={barData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        x: {
                          stacked: false,
                          display: true,
                          grid: {
                            display: false
                          },
                          ticks: {
                            maxRotation: 0,
                            minRotation: 0,
                            font: {
                              size: 12
                            }
                          }
                        },
                        y: {
                          stacked: false,
                          display: false,
                          beginAtZero: true,
                          suggestedMax: 12, // Increase y-axis maximum value
                          grid: {
                            display: false
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top',
                          labels: {
                            padding: 20
                          }
                        },
                        tooltip: {
                          enabled: true
                        },
                        dataLabels: {
                          display: true,
                          color: 'black',
                          align: 'end',
                          anchor: 'end'
                        }
                      }
                    }} 
                    plugins={[dataLabelsPlugin]}
                  />
                )}
              </div>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default App;
