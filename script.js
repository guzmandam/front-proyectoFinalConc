let eventSource;
let emitterId;
const API_BASE_URL = 'http://localhost:8080/api/jobs';

// DOM Elements
const searchForm = document.getElementById('searchForm');
const connectionStatus = document.getElementById('connectionStatus');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const resultsContainer = document.getElementById('resultsContainer');
const errorContainer = document.getElementById('errorContainer');
const errorMessage = document.getElementById('errorMessage');
const totalComputeTime = document.getElementById('totalComputeTime');

// Connect to SSE endpoint
function connect() {
    eventSource = new EventSource(`${API_BASE_URL}/connect`);
    
    eventSource.addEventListener('connect', (e) => {
        const data = JSON.parse(e.data);
        emitterId = data.emitterId;
        connectionStatus.textContent = 'Status: Conectado';
        connectionStatus.classList.remove('text-red-600');
        connectionStatus.classList.add('text-green-600');
    });

    eventSource.addEventListener('job_data', handleJobData);
    eventSource.addEventListener('progress', handleProgress);
    eventSource.addEventListener('error', handleError);
    eventSource.addEventListener('complete', handleComplete);

    eventSource.onerror = () => {
        connectionStatus.textContent = 'Status: Desconectado';
        connectionStatus.classList.remove('text-green-600');
        connectionStatus.classList.add('text-red-600');
    };
}

// Start scraping with keywords
async function startScraping(keywords) {
    try {
        // Reset UI
        resultsContainer.innerHTML = '';
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        progressContainer.classList.remove('hidden');
        errorContainer.classList.add('hidden');
        searchForm.classList.add('form-disabled');

        const response = await fetch(`${API_BASE_URL}/scrape/${emitterId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                keywords: keywords
            })
        });

        if (!response.ok) {
            throw new Error('Failed to start scraping');
        }

    } catch (error) {
        showError(error.message);
        searchForm.classList.remove('form-disabled');
    }
}

// Handle job data events
function handleJobData(event) {
    const data = JSON.parse(event.data);

    const site = data.site;
    const jobCards = data.data;

    for (i in jobCards) {
        let card = jobCards[i];
        let cardTitle = card.title;
        
        if (cardTitle) {
            createAndInsertJobCard(card, site);
        }
    }
}

function createAndInsertJobCard(jobCard, site) {
    const jC = createJobCard(jobCard, site);
    resultsContainer.insertAdjacentHTML('afterbegin', jC)
}

// Handle progress events
function handleProgress(event) {
    const data = JSON.parse(event.data);
    progressBar.style.width = `${data.percentage}%`;
    progressText.textContent = `${Math.round(data.percentage)}%`;
    progressBar.classList.add('progress-bar-animated');
}

// Handle error events
function handleError(event) {
    const data = JSON.parse(event.data);
    showError(data.error || 'An error occurred during scraping');
}

// Handle completion events
function handleComplete(event) {
    const data = JSON.parse(event.data);

    totalComputeTime.textContent = `${data.totalTime} ms`;

    searchForm.classList.remove('form-disabled');
    progressBar.classList.remove('progress-bar-animated');
    setTimeout(() => {
        progressContainer.classList.add('hidden');
    }, 2000);
}

// Create job card HTML
function createJobCard(data, site) {
    return `
        <div class="job-card bg-white rounded-lg shadow-md p-6 mb-4">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-lg font-semibold text-gray-800">${data.title || 'Job Title'}</h3>
                    <p class="text-gray-600">${data.company || 'Company Name'}</p>
                </div>
                <span class="text-sm text-gray-500">${site || 'Source'}</span>
            </div>
            ${data.url ? `
                <div class="mt-4">
                    <a href="${data.url}" target="_blank" 
                       class="text-blue-500 hover:text-blue-600">
                        View Job →
                    </a>
                </div>
            ` : ''}
        </div>
    `;
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorContainer.classList.remove('hidden');
}

// Clean up when leaving the page
window.addEventListener('beforeunload', () => {
    if (emitterId) {
        fetch(`${API_BASE_URL}/disconnect/${emitterId}`, {
            method: 'DELETE'
        });
    }
    if (eventSource) {
        eventSource.close();
    }
});

// Form submit handler
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const keywords = document.getElementById('keywords').value.trim();
    if (keywords) {
        startScraping(keywords);
    }
});

// Connect when page loads
connect();