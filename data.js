// data.js

// Function to fetch the list of JSON files from files.json
export async function fetchFiles() {
    try {
        const response = await fetch('/results/files.json');
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
        const dataPromises = files.map(async (file) => {
            const response = await fetch(`/results/${file}`);
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

// Function to parse the date in the format "4:54_pm_8_7_2024" and return only the date part
export function parseDate(dateStr) {
    const [time, ampm, day, month, year] = dateStr.split('_');
    return new Date(year, month - 1, day);
}

// Function to generate the date range for the past month
export function generateDateRange() {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);

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
            errors: item.errors, // Include the errors array
            hasData: true, // Mark as true since this entry has data
            name: titleCaseName // Add the title-cased name
        });
        return acc;
    }, {});

    // Sort each group by date
    for (const key in groupedData) {
        groupedData[key].sort((a, b) => a.date - b.date);
    }

    // Ensure each date in the range has a data point
    const dateRange = generateDateRange();
    for (const key in groupedData) {
        const titleCaseName = camelCaseToTitleCase(key);

        const filledData = dateRange.map(date => {
            const existing = groupedData[key].find(d => {
                return d.date.getFullYear() === date.getFullYear() && 
                       d.date.getMonth() === date.getMonth() && 
                       d.date.getDate() === date.getDate();
            });
            return existing 
                ? { 
                    date: date, 
                    average: existing.average, 
                    high: existing.high, 
                    low: existing.low, 
                    errors: existing.errors, 
                    hasData: true, // Mark as true since this date has data
                    name: titleCaseName // Add the title-cased name
                }
                : { 
                    date: date, 
                    average: null, 
                    high: null, 
                    low: null, 
                    errors: [], 
                    hasData: false, // Mark as false since this date has no data
                    name: titleCaseName // Add the title-cased name
                };
        });
        groupedData[key] = filledData;
    }

    return groupedData;
}
