// EcoPulse Climate-Economics Policy Simulator
// Congressional App Challenge - Environmental Economist & Systems Dynamicist

// State variables for the simulation
let currentGDP = 3.0; // Initial GDP growth rate in %
let currentEmissions = 36.0; // Initial global emissions in Gigatons
let currentTemperature = 1.1; // Initial temperature rise in Celsius

// Simulation parameters
const SIMULATION_YEARS = 20;
const TIME_LAG = 2; // Years of lag for policy effects

// DOM elements
const carbonTaxSlider = document.getElementById('carbonTax');
const greenSubsidiesSlider = document.getElementById('greenSubsidies');
const fossilRestrictionsSlider = document.getElementById('fossilRestrictions');

const carbonTaxValue = document.getElementById('carbonTaxValue');
const greenSubsidiesValue = document.getElementById('greenSubsidiesValue');
const fossilRestrictionsValue = document.getElementById('fossilRestrictionsValue');

const gdpGrowthElement = document.getElementById('gdpGrowth');
const carbonEmissionsElement = document.getElementById('carbonEmissions');
const temperatureRiseElement = document.getElementById('temperatureRise');

const simulateBtn = document.getElementById('simulateBtn');
const alertsContainer = document.getElementById('alertsContainer');
const chartCanvas = document.getElementById('simulationChart');

// Chart variable
let simulationChart = null;

// Dynamic data sources for real-time simulation calculations
let economicData = {
    gdpGrowthRate: 3.0,
    inflationRate: 2.0,
    energyPrices: 100
};

let environmentalData = {
    currentEmissions: 36.0,
    temperatureRise: 1.1,
    co2Concentration: 420 // ppm
};

// External API endpoints (these would be replaced with real API keys)
const API_ENDPOINTS = {
    ECONOMIC_DATA: 'https://api.economic-data.com/v1',
    ENVIRONMENTAL_DATA: 'https://api.environmental-data.com/v1',
    WEATHER_DATA: 'https://api.weather-data.com/v1',
    CURRENCY_EXCHANGE: 'https://api.currency-exchange.com/v1'
};

// Function to fetch real-time economic data
async function fetchRealTimeEconomicData() {
    try {
        // Simulated API call - replace with actual API implementation
        const response = await fetch(`${API_ENDPOINTS.ECONOMIC_DATA}/gdp?format=json`);
        
        if (response.ok) {
            const data = await response.json();
            economicData.gdpGrowthRate = data.gdpGrowthRate || 3.0;
            economicData.inflationRate = data.inflationRate || 2.0;
            economicData.energyPrices = data.energyPrices || 100;
            
            // Update displayed values
            gdpGrowthElement.textContent = economicData.gdpGrowthRate.toFixed(2) + '%';
        }
    } catch (error) {
        console.error('Error fetching economic data:', error);
    }
}

// Function to fetch real-time environmental data
async function fetchRealTimeEnvironmentalData() {
    try {
        // Simulated API call - replace with actual API implementation
        const response = await fetch(`${API_ENDPOINTS.ENVIRONMENTAL_DATA}/emissions?format=json`);
        
        if (response.ok) {
            const data = await response.json();
            environmentalData.currentEmissions = data.emissions || 36.0;
            environmentalData.temperatureRise = data.temperature || 1.1;
            environmentalData.co2Concentration = data.co2Concentration || 420;
            
            // Update displayed values
            carbonEmissionsElement.textContent = environmentalData.currentEmissions.toFixed(1) + ' GT';
            temperatureRiseElement.textContent = environmentalData.temperatureRise.toFixed(2) + '°C';
        }
    } catch (error) {
        console.error('Error fetching environmental data:', error);
    }
}

// Function to update current simulation state with real-time data
async function updateCurrentData() {
    await fetchRealTimeEconomicData();
    await fetchRealTimeEnvironmentalData();
    
    // Update global state
    currentGDP = economicData.gdpGrowthRate;
    currentEmissions = environmentalData.currentEmissions;
    currentTemperature = environmentalData.temperatureRise;
    
    // Update UI with new values
    displayResults(currentGDP, currentEmissions, currentTemperature);
}

// Update slider value displays
carbonTaxSlider.addEventListener('input', function() {
    carbonTaxValue.textContent = this.value;
});

greenSubsidiesSlider.addEventListener('input', function() {
    greenSubsidiesValue.textContent = this.value;
});

fossilRestrictionsSlider.addEventListener('input', function() {
    fossilRestrictionsValue.textContent = this.value;
});

// Main simulation function with live data integration
async function runSimulation() {
    // First, get the latest real-time data to use in calculations
    await updateCurrentData();
    
    // Get current policy values
    const carbonTax = parseFloat(carbonTaxSlider.value);
    const greenSubsidies = parseFloat(greenSubsidiesSlider.value);
    const fossilRestrictions = parseFloat(fossilRestrictionsSlider.value);
    
    // Initialize arrays to store historical data for lag effects
    const gdpHistory = Array(SIMULATION_YEARS).fill(currentGDP);
    const emissionsHistory = Array(SIMULATION_YEARS).fill(currentEmissions);
    const temperatureHistory = Array(SIMULATION_YEARS).fill(currentTemperature);
    
    // Store the final results
    let finalGDP = currentGDP;
    let finalEmissions = currentEmissions;
    let finalTemperature = currentTemperature;
    
    // Store yearly data for chart
    const gdpData = [];
    const emissionsData = [];
    const temperatureData = [];
    
    // Simulation loop for 20 years
    for (let year = 0; year < SIMULATION_YEARS; year++) {
        // Get delayed policy effects (with lag)
        const delayedCarbonTax = year >= TIME_LAG ? 
            parseFloat(carbonTaxSlider.value) : 
            (year > 0 ? parseFloat(carbonTaxSlider.value) * (year / TIME_LAG) : 0);
            
        const delayedGreenSubsidies = year >= TIME_LAG ? 
            parseFloat(greenSubsidiesSlider.value) : 
            (year > 0 ? parseFloat(greenSubsidiesSlider.value) * (year / TIME_LAG) : 0);
            
        const delayedFossilRestrictions = year >= TIME_LAG ? 
            parseFloat(fossilRestrictionsSlider.value) : 
            (year > 0 ? parseFloat(fossilRestrictionsSlider.value) * (year / TIME_LAG) : 0);

        // Calculate economic effects with diminishing returns and real-time factors
        let gdpEffect = calculateGDPEffect(
            delayedCarbonTax, 
            delayedGreenSubsidies, 
            delayedFossilRestrictions
        );
        
        // Add dynamic effects from real-time economic data
        gdpEffect += (economicData.gdpGrowthRate - 3.0) * 0.05; // Feedback from current GDP
        
        // Economic feedback loop
        let newGDP = gdpHistory[year] + gdpEffect;
        
        // Prevent negative GDP growth (minimum 0%)
        newGDP = Math.max(0, newGDP);
        
        // Calculate emissions effects with diminishing returns and real-time factors
        let emissionsEffect = calculateEmissionsEffect(
            delayedCarbonTax,
            delayedGreenSubsidies,
            delayedFossilRestrictions
        );
        
        // Add environmental feedback based on current conditions
        emissionsEffect += (environmentalData.currentEmissions - 36.0) * 0.01;
        
        // Apply emissions effect to previous value with feedback loop
        let newEmissions = emissionsHistory[year] + emissionsEffect;
        
        // Ensure positive emissions (minimum 0 GT)
        newEmissions = Math.max(0, newEmissions);
        
        // Calculate temperature effects with feedback and lag
        let temperatureEffect = calculateTemperatureEffect(
            newEmissions,
            delayedFossilRestrictions,
            year
        );
        
        // Add dynamic effects from real-time environmental data
        temperatureEffect += (environmentalData.temperatureRise - 1.1) * 0.03;
        
        // Update temperature with feedback
        let newTemperature = temperatureHistory[year] + temperatureEffect;
        
        // Store results for chart
        gdpData.push(newGDP);
        emissionsData.push(newEmissions);
        temperatureData.push(newTemperature);
        
        // Store results
        gdpHistory[year] = newGDP;
        emissionsHistory[year] = newEmissions;
        temperatureHistory[year] = newTemperature;
        
        // Update final values (last year's simulation)
        if (year === SIMULATION_YEARS - 1) {
            finalGDP = newGDP;
            finalEmissions = newEmissions;
            finalTemperature = newTemperature;
        }
    }
    
    // Display results
    displayResults(finalGDP, finalEmissions, finalTemperature);
    
    // Show alerts if needed
    showAlerts(finalGDP, finalTemperature);
    
    // Update chart with enhanced dynamic data
    updateChart(gdpData, emissionsData);
}

// Calculate GDP growth rate effect with diminishing returns
function calculateGDPEffect(carbonTax, greenSubsidies, fossilRestrictions) {
    let gdpChange = 0;
    
    // Carbon tax effect (diminishing returns)
    const taxImpact = -carbonTax * 0.02; // Negative because higher taxes reduce growth
    const taxDiminishing = 1 / (1 + Math.exp(-(carbonTax - 75) / 50)); // Logistic curve for diminishing returns
    
    // Green subsidies effect (diminishing returns)
    const subsidyImpact = greenSubsidies * 0.03; // Positive impact from subsidies
    const subsidyDiminishing = 1 / (1 + Math.exp(-(greenSubsidies - 50) / 30)); // Logistic curve for diminishing returns
    
    // Fossil fuel restrictions effect
    const restrictionImpact = -fossilRestrictions * 0.01; // Negative impact from restrictions
    
    // Apply diminishing returns to the impacts
    const adjustedTaxImpact = taxImpact * taxDiminishing;
    const adjustedSubsidyImpact = subsidyImpact * subsidyDiminishing;
    
    // Combine effects (feedback loop - some effects influence others)
    gdpChange = adjustedTaxImpact + adjustedSubsidyImpact + restrictionImpact;
    
    // Add feedback based on current GDP and real-time economic factors
    // Economic growth is influenced by other variables in a non-linear way
    const multiplier = 0.1; // Feedback multiplier
    
    // Incorporate dynamic economic conditions
    gdpChange += (economicData.gdpGrowthRate - 3.0) * 0.05;
    
    return gdpChange + (multiplier * (gdpHistory[0] - 3.0));
}

// Calculate carbon emissions effect with diminishing returns
function calculateEmissionsEffect(carbonTax, greenSubsidies, fossilRestrictions) {
    let emissionsChange = 0;
    
    // Base emissions reduction from fossil fuel restrictions
    const restrictionEffect = -fossilRestrictions * 0.2; // Direct impact
    
    // Carbon tax effect (diminishing returns)
    const taxImpact = -carbonTax * 0.015; // Negative because it reduces emissions
    const taxDiminishing = 1 / (1 + Math.exp(-(carbonTax - 100) / 50)); // Logistic curve for diminishing returns
    
    // Green subsidies effect
    const subsidyEffect = -greenSubsidies * 0.02;
    const subsidyDiminishing = 1 / (1 + Math.exp(-(greenSubsidies - 40) / 25)); // Logistic curve for diminishing returns
    
    // Apply diminishing returns to impacts
    const adjustedTaxImpact = taxImpact * taxDiminishing;
    const adjustedSubsidyEffect = subsidyEffect * subsidyDiminishing;
    
    emissionsChange = restrictionEffect + adjustedTaxImpact + adjustedSubsidyEffect;
    
    // Feedback effect: higher emissions from previous year cause some inertia in change
    const previousEmissionsEffect = (emissionsHistory[emissionsHistory.length-1] - 36.0) * 0.02;
    
    // Add feedback based on current economy state and real-time environmental conditions
    const economyFeedback = ((currentGDP - 3.0) * 0.1);
    
    // Incorporate dynamic environmental data influence
    emissionsChange += (environmentalData.currentEmissions - 36.0) * 0.005;
    
    return emissionsChange + previousEmissionsEffect + economyFeedback;
}

// Calculate temperature rise effect with non-linear dynamics
function calculateTemperatureEffect(emissions, fossilRestrictions, year) {
    // Base temperature rise from emissions
    let tempChange = emissions * 0.003; // Direct relationship between emissions and temperature
    
    // Feedback from economic growth - higher growth may lead to more emissions later
    const economicFeedback = (currentGDP * 0.01) * Math.log(year + 1);
    
    // Delayed temperature response
    const timeLagEffect = tempChange * (year / 20) * 0.2;
    
    // Fossil fuel restrictions reduce temperature rise
    const restrictionImpact = -fossilRestrictions * 0.001;
    
    // Add dynamic elements based on real-time data
    tempChange += (environmentalData.temperatureRise - 1.1) * 0.02; // Feedback from current temperature
    
    return tempChange + economicFeedback + timeLagEffect + restrictionImpact;
}

// Display results with proper formatting
function displayResults(gdp, emissions, temperature) {
    gdpGrowthElement.textContent = gdp.toFixed(2) + '%';
    carbonEmissionsElement.textContent = emissions.toFixed(1) + ' GT';
    temperatureRiseElement.textContent = temperature.toFixed(2) + '°C';
}

// Show dynamic alerts based on simulation results
function showAlerts(finalGDP, finalTemperature) {
    // Clear previous alerts
    alertsContainer.innerHTML = '';
    
    // Check for recession risk (GDP growth below 0%)
    if (finalGDP < 0) {
        const recessionAlert = document.createElement('div');
        recessionAlert.className = 'alert alert-danger';
        recessionAlert.innerHTML = '<strong>Recession Risk!</strong> GDP growth is negative. This suggests economic contraction and potential recessionary conditions.';
        alertsContainer.appendChild(recessionAlert);
    }
    
    // Check for temperature exceedance (above 1.5°C)
    if (finalTemperature > 1.5) {
        const tempAlert = document.createElement('div');
        tempAlert.className = 'alert alert-warning';
        tempAlert.innerHTML = '<strong>Climate Threshold Exceeded!</strong> Global temperature rise exceeds 1.5°C above pre-industrial levels. This threshold represents a significant climate risk.';
        alertsContainer.appendChild(tempAlert);
    }
    
    // Add a general analysis note
    if (finalGDP >= 0 && finalTemperature <= 1.5) {
        const successAlert = document.createElement('div');
        successAlert.className = 'alert alert-success';
        successAlert.innerHTML = '<strong>Simulation Results:</strong> Economic growth is positive and temperature rise remains within the target threshold.';
        alertsContainer.appendChild(successAlert);
    }
    
    // Add real-time data status
    const statusAlert = document.createElement('div');
    statusAlert.className = 'alert alert-info';
    statusAlert.innerHTML = `<strong>Real-time Data Status:</strong> 
        GDP Growth: ${economicData.gdpGrowthRate.toFixed(2)}% | 
        Emissions: ${environmentalData.currentEmissions.toFixed(1)} GT | 
        Temperature: ${environmentalData.temperatureRise.toFixed(2)}°C`;
    alertsContainer.appendChild(statusAlert);
}

// Update chart with simulation data
function updateChart(gdpData, emissionsData) {
    // Destroy existing chart if it exists
    if (simulationChart) {
        simulationChart.destroy();
    }
    
    // Prepare chart data
    const labels = Array.from({length: SIMULATION_YEARS}, (_, i) => `Year ${i + 1}`);
    
    const ctx = chartCanvas.getContext('2d');
    
    simulationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'GDP Growth Rate (%)',
                    data: gdpData,
                    borderColor: '#4dffb8',
                    backgroundColor: 'rgba(77, 255, 184, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Carbon Emissions (GT)',
                    data: emissionsData,
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: '20-Year Simulation Projections'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Years'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'GDP Growth Rate (%)'
                    },
                    position: 'left',
                    beginAtZero: false
                },
                y1: {
                    title: {
                        display: true,
                        text: 'Carbon Emissions (GT)'
                    },
                    position: 'right',
                    beginAtZero: false,
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

// Save simulation results to database
async function saveSimulationResults(finalGDP, finalEmissions, finalTemperature, policyParams) {
    try {
        await simulationDB.saveResult({
            gdp: finalGDP,
            emissions: finalEmissions,
            temperature: finalTemperature,
            policy: policyParams,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error saving simulation results:', error);
    }
}

// Main simulation function with live data integration
async function runSimulation() {
    // First, get the latest real-time data to use in calculations
    await updateCurrentData();
    
    // Get current policy values
    const carbonTax = parseFloat(carbonTaxSlider.value);
    const greenSubsidies = parseFloat(greenSubsidiesSlider.value);
    const fossilRestrictions = parseFloat(fossilRestrictionsSlider.value);
    
    // Store policy parameters for database
    const policyParams = {
        carbonTax,
        greenSubsidies,
        fossilRestrictions
    };
    
    // Initialize arrays to store historical data for lag effects
    const gdpHistory = Array(SIMULATION_YEARS).fill(currentGDP);
    const emissionsHistory = Array(SIMULATION_YEARS).fill(currentEmissions);
    const temperatureHistory = Array(SIMULATION_YEARS).fill(currentTemperature);
    
    // Store the final results
    let finalGDP = currentGDP;
    let finalEmissions = currentEmissions;
    let finalTemperature = currentTemperature;
    
    // Store yearly data for chart
    const gdpData = [];
    const emissionsData = [];
    const temperatureData = [];
    
    // Simulation loop for 20 years
    for (let year = 0; year < SIMULATION_YEARS; year++) {
        // Get delayed policy effects (with lag)
        const delayedCarbonTax = year >= TIME_LAG ? 
            parseFloat(carbonTaxSlider.value) : 
            (year > 0 ? parseFloat(carbonTaxSlider.value) * (year / TIME_LAG) : 0);
            
        const delayedGreenSubsidies = year >= TIME_LAG ? 
            parseFloat(greenSubsidiesSlider.value) : 
            (year > 0 ? parseFloat(greenSubsidiesSlider.value) * (year / TIME_LAG) : 0);
            
        const delayedFossilRestrictions = year >= TIME_LAG ? 
            parseFloat(fossilRestrictionsSlider.value) : 
            (year > 0 ? parseFloat(fossilRestrictionsSlider.value) * (year / TIME_LAG) : 0);

        // Calculate economic effects with diminishing returns and real-time factors
        let gdpEffect = calculateGDPEffect(
            delayedCarbonTax, 
            delayedGreenSubsidies, 
            delayedFossilRestrictions
        );
        
        // Add dynamic effects from real-time economic data
        gdpEffect += (economicData.gdpGrowthRate - 3.0) * 0.05; // Feedback from current GDP
        
        // Economic feedback loop
        let newGDP = gdpHistory[year] + gdpEffect;
        
        // Prevent negative GDP growth (minimum 0%)
        newGDP = Math.max(0, newGDP);
        
        // Calculate emissions effects with diminishing returns and real-time factors
        let emissionsEffect = calculateEmissionsEffect(
            delayedCarbonTax,
            delayedGreenSubsidies,
            delayedFossilRestrictions
        );
        
        // Add environmental feedback based on current conditions
        emissionsEffect += (environmentalData.currentEmissions - 36.0) * 0.01;
        
        // Apply emissions effect to previous value with feedback loop
        let newEmissions = emissionsHistory[year] + emissionsEffect;
        
        // Ensure positive emissions (minimum 0 GT)
        newEmissions = Math.max(0, newEmissions);
        
        // Calculate temperature effects with feedback and lag
        let temperatureEffect = calculateTemperatureEffect(
            newEmissions,
            delayedFossilRestrictions,
            year
        );
        
        // Add dynamic effects from real-time environmental data
        temperatureEffect += (environmentalData.temperatureRise - 1.1) * 0.03;
        
        // Update temperature with feedback
        let newTemperature = temperatureHistory[year] + temperatureEffect;
        
        // Store results for chart
        gdpData.push(newGDP);
        emissionsData.push(newEmissions);
        temperatureData.push(newTemperature);
        
        // Store results
        gdpHistory[year] = newGDP;
        emissionsHistory[year] = newEmissions;
        temperatureHistory[year] = newTemperature;
        
        // Update final values (last year's simulation)
        if (year === SIMULATION_YEARS - 1) {
            finalGDP = newGDP;
            finalEmissions = newEmissions;
            finalTemperature = newTemperature;
        }
    }
    
    // Display results
    displayResults(finalGDP, finalEmissions, finalTemperature);
    
    // Show alerts if needed
    showAlerts(finalGDP, finalTemperature);
    
    // Save to database
    saveSimulationResults(finalGDP, finalEmissions, finalTemperature, policyParams);
    
    // Update chart with enhanced dynamic data
    updateChart(gdpData, emissionsData);
}

// Initialize simulation with default values
displayResults(currentGDP, currentEmissions, currentTemperature);

// Event listener for the simulate button
simulateBtn.addEventListener('click', runSimulation);

// Set up periodic data updates to keep the app dynamic
setInterval(updateCurrentData, 30000); // Update every 30 seconds