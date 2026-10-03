/**
 * Password Strength & Breach-Pattern Checker
 * Client-Side Controller & Real-Time Analyzer
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const passwordInput = document.getElementById('password-input');
    const toggleBtn = document.getElementById('toggle-visibility-btn');
    const eyeIcon = document.getElementById('eye-icon');
    const eyeOffIcon = document.getElementById('eye-off-icon');
    const clearBtn = document.getElementById('clear-input-btn');
    const copyBtn = document.getElementById('copy-password-btn');
    const copyLabel = document.getElementById('copy-label');
    const checkForm = document.getElementById('password-form');
    const toast = document.getElementById('toast');

    // Generator elements
    const genLengthSlider = document.getElementById('gen-length');
    const genLengthVal = document.getElementById('gen-length-val');
    const genUpper = document.getElementById('gen-upper');
    const genLower = document.getElementById('gen-lower');
    const genDigits = document.getElementById('gen-digits');
    const genSymbols = document.getElementById('gen-symbols');
    const generateBtn = document.getElementById('generate-btn');

    // Preset buttons
    const presetButtons = document.querySelectorAll('.preset-btn');

    // Results container elements
    const emptyState = document.getElementById('empty-state');
    const resultsContent = document.getElementById('results-content');
    const statusBanner = document.getElementById('status-banner');
    const strengthBadge = document.getElementById('strength-badge');
    const entropyVal = document.getElementById('entropy-val');
    const breachPill = document.getElementById('breach-pill');
    const breachStatusText = document.getElementById('breach-status-text');
    const meterFill = document.getElementById('meter-fill');
    const strengthSummary = document.getElementById('strength-summary');

    // Breach Box
    const breachAlertBox = document.getElementById('breach-alert-box');
    const breachIcon = document.getElementById('breach-icon');
    const breachAlertTitle = document.getElementById('breach-alert-title');
    const breachDetails = document.getElementById('breach-details');

    // Formula & variables
    const formulaMath = document.getElementById('formula-math');
    const varLength = document.getElementById('var-length');
    const varPool = document.getElementById('var-pool');
    const varSpace = document.getElementById('var-space');
    const varEntropy = document.getElementById('var-entropy');

    // Character matrix
    const badgeLower = document.getElementById('badge-lower');
    const countLower = document.getElementById('count-lower');
    const badgeUpper = document.getElementById('badge-upper');
    const countUpper = document.getElementById('count-upper');
    const badgeDigit = document.getElementById('badge-digit');
    const countDigit = document.getElementById('count-digit');
    const badgeSymbol = document.getElementById('badge-symbol');
    const countSymbol = document.getElementById('count-symbol');

    // Crack times
    const timeOnline = document.getElementById('time-online');
    const timeGpu = document.getElementById('time-gpu');
    const timeSuper = document.getElementById('time-super');

    // Patterns & Recommendations
    const patternsCard = document.getElementById('patterns-card');
    const patternList = document.getElementById('pattern-list');
    const recommendationList = document.getElementById('recommendation-list');

    // Table rows
    const tableRows = {
        'Very Weak': document.getElementById('row-very-weak'),
        'Weak': document.getElementById('row-weak'),
        'Moderate': document.getElementById('row-moderate'),
        'Strong': document.getElementById('row-strong'),
        'Very Strong': document.getElementById('row-very-strong')
    };

    let debounceTimer = null;

    // -------------------------------------------------------------
    // Real-Time Analysis via API
    // -------------------------------------------------------------
    async function evaluatePassword(pwd) {
        if (!pwd || pwd.length === 0) {
            emptyState.classList.remove('hidden');
            resultsContent.classList.add('hidden');
            clearBtn.classList.add('hidden');
            highlightTableRow(null);
            return;
        }

        clearBtn.classList.remove('hidden');

        try {
            const response = await fetch('/api/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pwd })
            });

            if (!response.ok) throw new Error('API check failed');
            const data = await response.json();
            updateResultsUI(data);
        } catch (err) {
            console.error('Error checking password:', err);
        }
    }

    // -------------------------------------------------------------
    // Update Results UI
    // -------------------------------------------------------------
    function updateResultsUI(data) {
        emptyState.classList.add('hidden');
        resultsContent.classList.remove('hidden');

        const { length, entropy, formula_math, char_analysis, strength, breach_info, patterns, crack_times, recommendations } = data;

        // Banner & Badge
        statusBanner.style.borderColor = strength.color;
        strengthBadge.className = `badge ${strength.badge_class}`;
        strengthBadge.textContent = strength.tier;
        entropyVal.textContent = entropy.toFixed(2);

        meterFill.style.width = `${strength.score_percent}%`;
        meterFill.style.backgroundColor = strength.color;
        strengthSummary.textContent = strength.summary;

        // Breach pill & box
        if (breach_info.in_breach_list) {
            breachPill.className = 'breach-pill flag-danger';
            breachStatusText.textContent = breach_info.status_text;

            breachAlertBox.className = 'breach-alert-box breach-danger';
            breachIcon.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>`;
            breachAlertTitle.textContent = '⚠ Compromised in Common / Leaked Dataset';
            breachDetails.textContent = breach_info.details;
        } else {
            breachPill.className = 'breach-pill flag-safe';
            breachStatusText.textContent = 'NO';

            breachAlertBox.className = 'breach-alert-box breach-safe';
            breachIcon.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>`;
            breachAlertTitle.textContent = '✓ Local Dataset Check Passed';
            breachDetails.textContent = breach_info.details;
        }

        // Formula
        formulaMath.textContent = formula_math;
        varLength.textContent = `${length} chars`;
        varPool.textContent = `${char_analysis.pool_size} characters (${char_analysis.pool_breakdown || 'none'})`;
        varSpace.textContent = `${crack_times.combinations_formula} combinations`;
        varEntropy.textContent = `${entropy.toFixed(2)} bits`;

        // Character Matrix
        updateBadge(badgeLower, countLower, char_analysis.has_lower, char_analysis.count_lower);
        updateBadge(badgeUpper, countUpper, char_analysis.has_upper, char_analysis.count_upper);
        updateBadge(badgeDigit, countDigit, char_analysis.has_digit, char_analysis.count_digit);
        updateBadge(badgeSymbol, countSymbol, char_analysis.has_symbol, char_analysis.count_symbol);

        // Crack Times
        timeOnline.textContent = crack_times.online;
        timeGpu.textContent = crack_times.fast_gpu;
        timeSuper.textContent = crack_times.supercomputer;

        // Patterns
        if (patterns && patterns.length > 0) {
            patternsCard.classList.remove('hidden');
            patternList.innerHTML = patterns.map(p => `
                <div class="pattern-item">
                    <span class="pattern-tag">${escapeHtml(p.type)}</span>
                    <span class="pattern-desc">${escapeHtml(p.desc)}</span>
                </div>
            `).join('');
        } else {
            patternsCard.classList.add('hidden');
            patternList.innerHTML = '';
        }

        // Recommendations
        if (recommendations && recommendations.length > 0) {
            recommendationList.innerHTML = recommendations.map(r => `<li>${escapeHtml(r)}</li>`).join('');
        } else {
            recommendationList.innerHTML = '<li>Password has strong entropy and is not in local breach files!</li>';
        }

        // Highlight Educational Table Row
        highlightTableRow(strength.tier);
    }

    function updateBadge(badgeEl, countEl, hasCategory, count) {
        if (!badgeEl || !countEl) return;
        countEl.textContent = count;
        const iconSpan = badgeEl.querySelector('.badge-icon');
        if (hasCategory) {
            badgeEl.classList.add('active');
            if (iconSpan) iconSpan.textContent = '✓';
        } else {
            badgeEl.classList.remove('active');
            if (iconSpan) iconSpan.textContent = '✗';
        }
    }

    function highlightTableRow(activeTier) {
        Object.keys(tableRows).forEach(tier => {
            const row = tableRows[tier];
            if (row) {
                if (tier === activeTier) {
                    row.classList.add('active-row');
                } else {
                    row.classList.remove('active-row');
                }
            }
        });
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 2500);
    }

    // -------------------------------------------------------------
    // Event Listeners: Input & Realtime Debounce
    // -------------------------------------------------------------
    passwordInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const val = e.target.value;
        debounceTimer = setTimeout(() => {
            evaluatePassword(val);
        }, 120);
    });

    // Clear input
    clearBtn.addEventListener('click', () => {
        passwordInput.value = '';
        passwordInput.focus();
        evaluatePassword('');
    });

    // Visibility toggle
    toggleBtn.addEventListener('click', () => {
        const isPassword = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
        eyeIcon.classList.toggle('hidden', isPassword);
        eyeOffIcon.classList.toggle('hidden', !isPassword);
    });

    // Copy to clipboard
    copyBtn.addEventListener('click', async () => {
        const pwd = passwordInput.value;
        if (!pwd) {
            showToast('No password entered to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(pwd);
            copyLabel.textContent = 'Copied!';
            showToast('Password copied to clipboard!');
            setTimeout(() => {
                copyLabel.textContent = 'Copy';
            }, 2000);
        } catch (err) {
            // Fallback for older browsers
            passwordInput.select();
            document.execCommand('copy');
            copyLabel.textContent = 'Copied!';
            showToast('Password copied to clipboard!');
            setTimeout(() => {
                copyLabel.textContent = 'Copy';
            }, 2000);
        }
    });

    // Quick test preset chips
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const sample = btn.getAttribute('data-pw');
            if (sample) {
                passwordInput.value = sample;
                evaluatePassword(sample);
                passwordInput.focus();
                if (window.innerWidth <= 992) {
                    setTimeout(() => {
                        resultsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            }
        });
    });

    // -------------------------------------------------------------
    // Password Generator
    // -------------------------------------------------------------
    genLengthSlider.addEventListener('input', (e) => {
        genLengthVal.textContent = e.target.value;
    });

    generateBtn.addEventListener('click', async () => {
        const length = genLengthSlider.value;
        const upper = genUpper.checked;
        const lower = genLower.checked;
        const digits = genDigits.checked;
        const symbols = genSymbols.checked;

        try {
            const url = `/api/generate?length=${length}&upper=${upper}&lower=${lower}&digits=${digits}&symbols=${symbols}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Generation failed');
            const data = await res.json();

            passwordInput.value = data.password;
            updateResultsUI(data.evaluation);
            showToast('New strong password generated!');
            if (window.innerWidth <= 992) {
                setTimeout(() => {
                    resultsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        } catch (err) {
            console.error('Failed to generate password:', err);
        }
    });

    // Check if initial password already provided on page load (e.g. from POST or reload)
    if (passwordInput.value) {
        evaluatePassword(passwordInput.value);
    }
});
