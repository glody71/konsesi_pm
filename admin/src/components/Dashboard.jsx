// src/components/Dashboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { format } from 'date-fns';
import { id } from 'date-fns/locale'; // Import locale Indonesia

// Register the necessary components and plugins
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const Dashboard = () => {
    const [chartData, setChartData] = useState(null);
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        // Fetch the chart data
        axios.get('http://localhost:5000/api/konsesi-status')
            .then(response => {
                const data = response.data;

                if (Array.isArray(data)) {
                    const labels = data.map(item => item.status);
                    const values = data.map(item => item.count);

                    setChartData({
                        labels: labels,
                        datasets: [
                            {
                                data: values,
                                backgroundColor: [
                                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                                ],
                                hoverBackgroundColor: [
                                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                                ]
                            }
                        ]
                    });
                }
            })
            .catch(error => console.error('Error fetching data:', error));

        // Set the current date with day name and time with seconds
        const updateDate = () => {
            const now = new Date();
            const formattedDate = format(now, 'EEEE, dd MMMM yyyy HH:mm:ss', { locale: id }); // Format tanggal dengan waktu
            setCurrentDate(formattedDate);
        };

        // Update date and time initially
        updateDate();

        // Optionally, update every second to keep the time current
        const intervalId = setInterval(updateDate, 1000); // Update every second

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);

    }, []);

    // Chart options to display data labels inside the doughnut chart
    const options = {
        plugins: {
            datalabels: {
                color: '#fff',
                formatter: (value, context) => {
                    return value;
                },
                font: {
                    weight: 'bold',
                    size: '14' // Adjust the size as needed
                }
            },
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: (tooltipItem) => `${tooltipItem.label}: ${tooltipItem.raw}`,
                }
            }
        },
        maintainAspectRatio: false // Allows the chart to resize based on the container's size
    };

    return (
        <div className="p-7 m-5 bg-white h-full rounded-lg">
            <div className='flex justify-between'>
                <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
                <p className="text-md text-gray-500 mb-4">
                    {currentDate} {/* Menampilkan tanggal dengan hari dan waktu */}
                </p>
            </div>
            {chartData ? (
                <div className="max-w-sm mt-2 bg-white shadow-lg rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-6 py-4">
                        <h2 className="text-xl font-bold mb-2">Status Distribution</h2>
                    </div>
                    <div className="p-4">
                        <div className="w-64 h-64 mx-auto"> {/* Centering chart within the card */}
                            <Doughnut data={chartData} options={options} />
                        </div>
                    </div>
                </div>
            ) : (
                <p>Loading chart...</p>
            )}
        </div>
    );
};

export default Dashboard;
