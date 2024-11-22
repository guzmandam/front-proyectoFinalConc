const API_BASE_URL = 'http://localhost:8080/api/sequential/jobs';

// DOM Elements
const searchForm = document.getElementById('searchForm');
const loadingStatus = document.getElementById('loading');
const resultsContainer = document.getElementById('resultsContainer');
const errorContainer = document.getElementById('errorContainer');
const errorMessage = document.getElementById('errorMessage');
const totalComputeTime = document.getElementById('totalComputeTime');

// Start scraping with keywords
async function startScraping(keywords) {
    try {
        // Reset UI
        resultsContainer.innerHTML = '';
        errorContainer.classList.add('hidden');
        searchForm.classList.add('form-disabled');

        loadingStatus.style.display = 'block';

        const response = await fetch(`${API_BASE_URL}/scrape`, {
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

        // Display the data
        response.json().then(
            responseJSON => {
                const responseData = responseJSON.data;
                const responseTotalTime = responseJSON.totalTime;
        
                // Display job cards
                for (i in responseData) {
                    let dataFromSite = responseData[i];
                    let site = dataFromSite.site;
                    let resultsSite = dataFromSite.data;
        
                    for (j in resultsSite) {
                        let card = resultsSite[j];
                        let cardTitle = card.title;
        
                        if (cardTitle) {
                            createAndInsertJobCard(card, site);
                        }
                    }
                }

                loadingStatus.style.display = 'none';

                // Display compute time
                totalComputeTime.textContent = `${responseTotalTime} ms`;
            }
        );

    } catch (error) {
        showError(error.message);
        searchForm.classList.remove('form-disabled');
    } 
}

function createAndInsertJobCard(jobCard, site) {
    const jC = createJobCard(jobCard, site);
    resultsContainer.insertAdjacentHTML('afterbegin', jC)
}


// Handle error events
function handleError(event) {
    const data = JSON.parse(event.data);
    showError(data.error || 'An error occurred during scraping');
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

// Form submit handler
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const keywords = document.getElementById('keywords').value.trim();
    if (keywords) {
        startScraping(keywords);
    }
});