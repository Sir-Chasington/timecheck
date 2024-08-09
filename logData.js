import { fetchData, processData } from './data.js';

fetchData().then(data => {
    if (data) {
        const processedData = processData(data);
        console.log('Processed Data:', processedData);
    } else {
        console.error('No data to display');
    }
});
