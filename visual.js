import { fetchData, processData } from './data.js';

const legendState = {};

const customLegendPlugin = {
    id: 'customLegend',
    afterUpdate(chart) {
        const container = chart.canvas.parentNode;
        let textContainer = container.querySelector('.custom-legend');

        if (textContainer) {
            textContainer.innerHTML = '';
        } else {
            textContainer = document.createElement('div');
            textContainer.className = 'custom-legend';
            textContainer.style.display = 'flex';
            textContainer.style.flexWrap = 'wrap';
            textContainer.style.gap = '20px';
            textContainer.style.justifyContent = 'center';
            container.appendChild(textContainer);
        }

        const data = chart.data;
        const datasets = data.datasets;

        const groupMap = {};

        datasets.forEach((dataset, i) => {
            const groupName = dataset.label.split(' ')[0];
            if (!groupMap[groupName]) {
                groupMap[groupName] = [];
            }
            groupMap[groupName].push({ dataset, datasetIndex: i });
        });

        Object.keys(groupMap).forEach(groupName => {
            const groupContainer = document.createElement('div');
            groupContainer.style.display = 'flex';
            groupContainer.style.flexDirection = 'column';
            groupContainer.style.alignItems = 'left';
            groupContainer.style.border = '1px solid #ccc';
            groupContainer.style.padding = '10px';
            groupContainer.style.margin = '5px';

            groupMap[groupName].forEach(item => {
                const { dataset, datasetIndex } = item;
                const listItem = document.createElement('div');
                listItem.style.display = 'flex';
                listItem.style.alignItems = 'left';
                listItem.style.marginBottom = '5px';
                listItem.style.cursor = 'pointer';
                listItem.classList.add('legend-item');

                const label = dataset.label;

                if (legendState[label]) {
                    listItem.classList.add('hidden');
                    chart.getDatasetMeta(datasetIndex).hidden = true;
                }

                listItem.onclick = () => {
                    const meta = chart.getDatasetMeta(datasetIndex);
                    meta.hidden = !meta.hidden;
                    listItem.classList.toggle('hidden');

                    legendState[label] = meta.hidden;

                    setTimeout(() => {
                        chart.update();
                    }, 0);
                };

                const box = document.createElement('span');
                box.style.background = dataset.borderColor;
                box.style.border = `2px solid ${dataset.borderColor}`;
                box.style.display = 'inline-block';
                box.style.height = '10px';
                box.style.marginRight = '10px';
                box.style.width = '10px';
                box.style.borderRadius = '4px';

                const text = document.createElement('span');
                text.style.fontSize = '12px';
                text.style.fontFamily = 'Arial';
                text.innerText = dataset.label;

                listItem.appendChild(box);
                listItem.appendChild(text);
                groupContainer.appendChild(listItem);
            });

            textContainer.appendChild(groupContainer);
        });
    }
};

// Fetch data and generate the chart
fetchData().then(data => {
    if (data) {
        const processedData = processData(data);
        generateChart(processedData);
    } else {
        console.error('No data to display');
    }
});

// Function to generate the chart
function generateChart(data) {
    const ctx = document.getElementById('resultsChart').getContext('2d');
    const datasets = Object.keys(data).map((filename, index) => {
        const color = `hsl(${(index * 360 / Object.keys(data).length)}, 100%, 50%)`;
        const variant = (percentage) => `hsl(${(index * 360 / Object.keys(data).length)}, 100%, ${percentage}%)`;
        
        return [
            {
                label: `${filename} Average`,
                data: data[filename].map(item => ({ x: item.date, y: item.average })),
                borderColor: variant(50),
                backgroundColor: 'transparent',
                borderWidth: 2,
                spanGaps: true
            },
            {
                label: `${filename} High`,
                data: data[filename].map(item => ({ x: item.date, y: item.high })),
                borderColor: variant(70),
                backgroundColor: 'transparent',
                borderWidth: 2,
                spanGaps: true
            },
            {
                label: `${filename} Low`,
                data: data[filename].map(item => ({ x: item.date, y: item.low })),
                borderColor: variant(30),
                backgroundColor: 'transparent',
                borderWidth: 2,
                spanGaps: true
            }
        ];
    }).flat();

    new Chart(ctx, {
        type: 'line',
        data: {
            datasets
        },
        options: {
            plugins: {
                customLegend: true,
                legend: {
                    display: false  // Disable default legend
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        tooltipFormat: 'MMM d, yyyy',
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    min: 0,
                    max: 6000,
                    ticks: {
                        stepSize: 100
                    },
                    title: {
                        display: true,
                        text: 'Milliseconds'
                    }
                }
            }
        },
        plugins: [customLegendPlugin]
    });
}
