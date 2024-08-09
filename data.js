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

// The rest of the file remains the same...
