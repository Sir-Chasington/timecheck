// data.js

// Function to get the base URL dynamically
function getBaseUrl() {
    const pathArray = window.location.pathname.split('/');
    return window.location.origin + '/' + pathArray[1];
}

// Function to fetch the list of JSON files from files.json
export async function fetchFiles() {
    try {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/results/files.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const files = await response.json();
        return files;
    } catch (error) {
        console.error('Error fetching files:', error);
    }
}

// Function to fetch and parse the content of each file
export async function fetchData() {
    try {
        const files = await fetchFiles();
        if (!files) {
            throw new Error('No files found');
        }
        const baseUrl = getBaseUrl();
        const dataPromises = files.map(async (file) => {
            const response = await fetch(`${baseUrl}/results/${file}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        });
        const data = await Promise.all(dataPromises);
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Function to parse the date and time in the format "8:31_am_13_8_2024" and return a Date object
export function parseDate(dateStr) {
    const [time, ampm, day, month, year] = dateStr.split('_');
    const [hours, minutes] = time.split(':').map(Number);

    // Adjust for PM if necessary
    let adjustedHours = hours;
    if (ampm.toLowerCase() === 'pm' && hours < 12) {
        adjustedHours += 12;
    } else if (ampm.toLowerCase() === 'am' && hours === 12) {
        adjustedHours = 0; // Handle midnight
    }

    const date = new Date(year, month - 1, day);
    date.setHours(adjustedHours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    
    return date;
}

// Function to generate the date range for the past `days` days
export function generateDateRange(days = 30) {
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const dateArray = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        dateArray.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateArray;
}


// Function to convert camelCase to "Title Case"
export function camelCaseToTitleCase(camelCaseStr) {
    return camelCaseStr
        .replace(/([A-Z])/g, ' $1')  // Insert a space before all capital letters
        .replace(/^./, str => str.toUpperCase());  // Capitalize the first letter
}

// Function to process data to group by filename and sort by date, including errors, hasData, and name
export function processData(data) {
    const groupedData = data.reduce((acc, item) => {
        if (!acc[item.filename]) acc[item.filename] = [];
        const titleCaseName = camelCaseToTitleCase(item.filename);

        acc[item.filename].push({
            date: parseDate(item.formattedDate),
            average: item.average,
            high: item.high,
            low: item.low,
            errors: item.errors,
            hasData: true,
            name: titleCaseName
        });

        return acc;
    }, {});

    // Sort each group by date and time
    for (const key in groupedData) {
        groupedData[key].sort((a, b) => a.date - b.date);
    }

    // Limit the data to the last 30 days while keeping multiple points per day
    const last30Days = generateDateRange(30);
    for (const key in groupedData) {
        groupedData[key] = groupedData[key].filter(d => {
            return last30Days.some(date => (
                date.getFullYear() === d.date.getFullYear() && 
                date.getMonth() === d.date.getMonth() && 
                date.getDate() === d.date.getDate()
            ));
        });
    }

    return groupedData;
}

