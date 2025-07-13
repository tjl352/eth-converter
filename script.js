var ethPrice = 2450;
var weiPerEth = 1000000000000000000;
var gweiPerEth = 1000000000;

function cleanInput(value) {
    var cleaned = value.replace(/[^0-9.]/g, '');
    var parts = cleaned.split('.');
    if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
}

function formatNumber(num) {
    if (num === 0) return '0';
    
    var str = num.toString();
    
    // If already in scientific notation, clean it up
    if (str.indexOf('e+') !== -1 || str.indexOf('E+') !== -1) {
        // For very large numbers, use scientific notation if string would be too long
        if (str.length > 25) {
            return parseFloat(num).toExponential(2);
        }
        
        var parts = str.toLowerCase().split('e+');
        var base = parseFloat(parts[0]);
        var exp = parseInt(parts[1]);
        
        var result = base.toString().replace('.', '');
        var decimalPos = base.toString().indexOf('.');
        if (decimalPos === -1) decimalPos = base.toString().length;
        
        var zerosToAdd = exp - (base.toString().length - decimalPos - 1);
        for (var i = 0; i < zerosToAdd; i++) {
            result += '0';
        }
        
        // If result is too long, use scientific notation
        if (result.length > 30) {
            return parseFloat(num).toExponential(2);
        }
        
        return result;
    }
    
    // For negative scientific notation  
    if (str.indexOf('e-') !== -1 || str.indexOf('E-') !== -1) {
        return parseFloat(num.toPrecision(15)).toString();
    }
    
    // Check if the regular string is too long
    if (str.length > 30) {
        return parseFloat(num).toExponential(2);
    }
    
    return str;
}

function formatUSD(num) {
    var rounded = Math.round(num * 100) / 100;
    var parts = rounded.toString().split('.');
    var wholePart = parts[0];
    var decimalPart = parts[1] || '00';
    
    wholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    if (decimalPart.length === 1) decimalPart += '0';
    if (decimalPart.length === 0) decimalPart = '00';
    
    return '$' + wholePart + '.' + decimalPart;
}

function fetchPrice() {
    fetch('https://www.okx.com/api/v5/market/ticker?instId=ETH-USDT')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.code === '0' && data.data && data.data.length > 0) {
                ethPrice = parseFloat(data.data[0].last);
            }
        })
        .catch(function(error) {
            console.log('Using fallback price');
        });
}

function calculate(amount, unit) {
    var num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return null;

    var ethAmount = 0;
    
    if (unit === 'wei') {
        ethAmount = num / weiPerEth;
    } else if (unit === 'gwei') {
        ethAmount = num / gweiPerEth;
    } else if (unit === 'eth') {
        ethAmount = num;
    } else if (unit === 'usd') {
        ethAmount = num / ethPrice;
    }

    return {
        wei: ethAmount * weiPerEth,
        gwei: ethAmount * gweiPerEth,
        eth: ethAmount,
        usd: ethAmount * ethPrice
    };
}

function updateDisplay(data) {
    document.getElementById('weiValue').textContent = formatNumber(data.wei);
    document.getElementById('gweiValue').textContent = formatNumber(data.gwei);
    document.getElementById('ethValue').textContent = formatNumber(data.eth);
    document.getElementById('usdValue').textContent = formatUSD(data.usd);
}

function convert() {
    var input = document.getElementById('amountInput');
    var unit = document.getElementById('unitSelect').value;
    var results = document.getElementById('resultsDiv');

    var cleaned = cleanInput(input.value);
    input.value = cleaned;

    if (cleaned && parseFloat(cleaned) > 0) {
        fetchPrice();
        
        setTimeout(function() {
            var data = calculate(cleaned, unit);
            if (data) {
                updateDisplay(data);
                results.classList.add('show');

                var btn = document.getElementById('convertBtn');
                btn.style.transform = 'scale(0.95)';
                setTimeout(function() {
                    btn.style.transform = 'scale(1)';
                }, 150);
            }
        }, 200);
    }
}

function openModal(type) {
    var modal = document.getElementById('paymentModal');
    var modalIcon = document.getElementById('modalIcon');
    var modalTitleText = document.getElementById('modalTitleText');
    var modalBody = document.getElementById('modalBody');

    if (type === 'metamask') {
        modalIcon.textContent = '🦊';
        modalTitleText.textContent = 'MetaMask Payment';
        modalBody.innerHTML = 
            '<div class="metamask-content">' +
                '<div class="metamask-icon">🦊</div>' +
                '<div class="metamask-title">Send ETH Tip</div>' +
                '<div class="metamask-instructions">Copy the address below and paste it into your MetaMask wallet to send a tip.</div>' +
                '<div class="address-container">' +
                    '<input type="text" class="address-input" value="0x742d35Cc6734C0532925a3b8D369d7763BeD04e5" readonly id="ethAddress">' +
                    '<button class="copy-button" id="copyAddressBtn">📋</button>' +
                '</div>' +
                '<div class="copy-success" id="copySuccess">Address copied to clipboard!</div>' +
            '</div>';
        
        setTimeout(function() {
            var copyBtn = document.getElementById('copyAddressBtn');
            var addressInput = document.getElementById('ethAddress');
            var copySuccess = document.getElementById('copySuccess');
            
            copyBtn.addEventListener('click', function() {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(addressInput.value).then(function() {
                        copySuccess.classList.add('show');
                        setTimeout(function() {
                            copySuccess.classList.remove('show');
                        }, 2000);
                    });
                } else {
                    addressInput.select();
                    document.execCommand('copy');
                    copySuccess.classList.add('show');
                    setTimeout(function() {
                        copySuccess.classList.remove('show');
                    }, 2000);
                }
            });
            
            addressInput.addEventListener('click', function() {
                this.select();
            });
        }, 100);
        
    } else if (type === 'cashapp') {
        modalIcon.textContent = '💚';
        modalTitleText.textContent = 'Cash App Payment';
        modalBody.innerHTML = 
            '<div class="metamask-content">' +
                '<div class="metamask-icon">💚</div>' +
                '<div class="metamask-title">Send Cash App Tip</div>' +
                '<div class="metamask-instructions">Send to <span class="username-highlight">$thomaslee2018</span> via the website:</div>' +
                '<div class="address-container">' +
                    '<input type="text" class="address-input" value="https://cash.app/account/pay-and-request" readonly id="desktopUrl">' +
                    '<button class="copy-button" id="desktopBtn">🖥️</button>' +
                '</div>' +
                '<div class="metamask-instructions" style="margin-top: 15px;">Or use mobile:</div>' +
                '<div class="address-container">' +
                    '<input type="text" class="address-input" value="https://cash.app/$thomaslee2018" readonly id="mobileUrl">' +
                    '<button class="copy-button" id="mobileBtn">📱</button>' +
                '</div>' +
            '</div>';
        
        setTimeout(function() {
            document.getElementById('desktopBtn').addEventListener('click', function() {
                window.open('https://cash.app/account/pay-and-request', '_blank');
            });
            
            document.getElementById('mobileBtn').addEventListener('click', function() {
                window.open('https://cash.app/$thomaslee2018', '_blank');
            });
            
            document.getElementById('desktopUrl').addEventListener('click', function() {
                this.select();
            });
            
            document.getElementById('mobileUrl').addEventListener('click', function() {
                this.select();
            });
        }, 100);
        
    } else if (type === 'paypal') {
        modalIcon.textContent = '💙';
        modalTitleText.textContent = 'PayPal Payment';
        modalBody.innerHTML = 
            '<div class="payment-widget">' +
                '<div class="payment-instructions">Enter tip amount</div>' +
                '<div class="payment-widget-container">' +
                    '<div class="amount-input-container">' +
                        '<span class="currency-symbol">$</span>' +
                        '<input type="number" class="amount-input" placeholder="Amount" id="paypalAmount" min="1" step="0.01">' +
                    '</div>' +
                    '<button class="send-payment-btn" id="sendPayPalBtn" disabled>Send via PayPal</button>' +
                '</div>' +
            '</div>';
        
        setTimeout(function() {
            var amountInput = document.getElementById('paypalAmount');
            var sendBtn = document.getElementById('sendPayPalBtn');
            
            amountInput.addEventListener('input', function() {
                var amount = parseFloat(this.value);
                if (amount && amount > 0) {
                    sendBtn.disabled = false;
                } else {
                    sendBtn.disabled = true;
                }
            });
            
            sendBtn.addEventListener('click', function() {
                var amount = parseFloat(amountInput.value);
                if (amount && amount > 0) {
                    var formattedAmount = Math.round(amount * 100) / 100;
                    var paypalUrl = 'https://www.paypal.com/paypalme/tjl352/' + formattedAmount.toString();
                    window.open(paypalUrl, '_blank');
                    closeModal();
                }
            });
            
            amountInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !sendBtn.disabled) {
                    sendBtn.click();
                }
            });
        }, 100);
    }

    modal.classList.add('show');
}

function closeModal() {
    var modal = document.getElementById('paymentModal');
    modal.classList.remove('show');
}

function init() {
    var input = document.getElementById('amountInput');
    var button = document.getElementById('convertBtn');
    var results = document.getElementById('resultsDiv');

    fetchPrice();

    button.addEventListener('click', convert);
    document.getElementById('metamaskBtn').addEventListener('click', function() { openModal('metamask'); });
    document.getElementById('closeModal').addEventListener('click', closeModal);

    document.getElementById('paymentModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            convert();
        }
    });

    input.addEventListener('keydown', function(e) {
        var allowed = [8, 9, 27, 13, 46, 110, 190, 35, 36, 37, 38, 39, 40];
        var isNum = (e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105);
        var isCtrl = e.ctrlKey && [65, 67, 86, 88].indexOf(e.keyCode) !== -1;

        if (!isNum && allowed.indexOf(e.keyCode) === -1 && !isCtrl) {
            e.preventDefault();
        }
    });

    input.addEventListener('input', function() {
        var cleaned = cleanInput(this.value);
        if (this.value !== cleaned) {
            var pos = this.selectionStart;
            this.value = cleaned;
            this.setSelectionRange(pos, pos);
        }

        if (!cleaned) {
            results.classList.remove('show');
        }
    });

    input.addEventListener('paste', function(e) {
        e.preventDefault();
        var paste = (e.clipboardData || window.clipboardData).getData('text');
        this.value = cleanInput(paste);
    });
}

document.addEventListener('DOMContentLoaded', init); 