

document.addEventListener("DOMContentLoaded", () => {

    // ===================================
    // FAQ TOGGLE
    // ===================================

    const faqQuestions = document.querySelectorAll("#faq h3");

    faqQuestions.forEach(question => {

        const answer = question.nextElementSibling;

        answer.style.display = "none";
        question.style.cursor = "pointer";

        question.addEventListener("click", () => {

            if (answer.style.display === "none") {
                answer.style.display = "block";
            } else {
                answer.style.display = "none";
            }

        });

    });


    // ===================================
    // ADD TO CART BUTTONS & CART LOGIC
    // ===================================

    const DELIVERY_FEE = 50;

    function loadCart() {
        const raw = sessionStorage.getItem('cart');
        return raw ? JSON.parse(raw) : { items: [] };
    }

    function saveCart(cart) {
        sessionStorage.setItem('cart', JSON.stringify(cart));
    }

    function computeTotals(cart) {
        const subtotal = cart.items.reduce((s, it) => s + (Number(it.price) * Number(it.qty)), 0);
        const delivery = subtotal > 0 ? DELIVERY_FEE : 0;
        const total = subtotal + delivery;
        return { subtotal, delivery, total };
    }

    function formatR(amount) {
        return 'R' + amount;
    }

    function updateCartUI() {
        const cart = loadCart();
        const totals = computeTotals(cart);

        const count = cart.items.reduce((c, it) => c + Number(it.qty), 0);
        const elCount = document.getElementById('cart-count');
        if (elCount) elCount.textContent = count;
        const elSubtotal = document.getElementById('cart-subtotal'); if (elSubtotal) elSubtotal.textContent = formatR(totals.subtotal);
        const elDelivery = document.getElementById('cart-delivery'); if (elDelivery) elDelivery.textContent = formatR(totals.delivery);
        const elTotal = document.getElementById('cart-total'); if (elTotal) elTotal.textContent = formatR(totals.total);

        const list = document.getElementById('cart-items-list');
        if (list) list.innerHTML = '';
        cart.items.forEach(it => {
            const li = document.createElement('li');
            li.textContent = `${it.name} × ${it.qty} — R${Number(it.price) * Number(it.qty)}`;
            if (list) list.appendChild(li);
        });

        const details = document.getElementById('cart-details');
        if (details) {
            if (count === 0) {
                details.setAttribute('hidden', '');
                if (elDelivery) elDelivery.textContent = 'R0';
            }
        }
    }

    function addToCart(name, price) {
        const cart = loadCart();
        const existing = cart.items.find(i => i.name === name);
        if (existing) {
            existing.qty = Number(existing.qty) + 1;
        } else {
            cart.items.push({ name, price: Number(price), qty: 1 });
        }
        saveCart(cart);
        updateCartUI();
    }

    // wire up product buttons
    const productButtons = document.querySelectorAll('#products article button');

    productButtons.forEach(button => {
        button.addEventListener('click', () => {
            const article = button.closest('article');
            const name = article.querySelector('h3').textContent.trim();
            const price = article.dataset.price ? Number(article.dataset.price) : (function() {
                const p = article.querySelector('p strong');
                return p ? Number((p.textContent || '').replace(/[^0-9.]/g, '')) : 0;
            })();

            addToCart(name, price);

            // tiny confirmation (non-blocking)
            button.textContent = 'Added ✓';
            setTimeout(() => { button.textContent = 'Add to Cart'; }, 900);
        });
    });

    // cart toggle / actions
    const cartToggle = document.getElementById('cart-toggle');
    if (cartToggle) {
        cartToggle.addEventListener('click', () => {
            const details = document.getElementById('cart-details');
            if (details.hasAttribute('hidden')) {
                details.removeAttribute('hidden');
            } else {
                details.setAttribute('hidden', '');
            }
        });
    }

    const clearBtn = document.getElementById('cart-clear');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            const cart = loadCart();
            if (cart.items && cart.items.length > 0) {
                // If there are items, show checkout modal instead of immediately clearing
                // (user requested modal only when attempting actions with items)
                if (typeof openCheckout === 'function') {
                    openCheckout();
                }
            } else {
                sessionStorage.removeItem('cart');
                updateCartUI();
            }
        });
    }

    const checkoutBtn = document.getElementById('cart-checkout');
    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutForm = document.getElementById('checkout-form');
    const checkoutCancel = document.getElementById('checkout-cancel');
    const checkoutResult = document.getElementById('checkout-result');

    // Ensure modal is hidden on load (CSS may show it otherwise)
    if (checkoutModal) checkoutModal.style.display = 'none';

    function openCheckout() {
        const cart = loadCart();
        if (!cart.items || cart.items.length === 0) {
            alert('Your cart is empty');
            return;
        }
        if (checkoutModal) {
            checkoutModal.style.display = 'flex';
        }
    }

    function closeCheckout() {
        if (checkoutModal) checkoutModal.style.display = 'none';
        if (checkoutResult) { checkoutResult.setAttribute('hidden', ''); }
        if (checkoutForm) { checkoutForm.style.display = ''; checkoutForm.reset(); }
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', openCheckout);
    }

    if (checkoutCancel) {
        checkoutCancel.addEventListener('click', closeCheckout);
    }

    function saveOrderLocally(order) {
        const raw = localStorage.getItem('orders');
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift(order);
        localStorage.setItem('orders', JSON.stringify(arr));
    }

    function sendOrderEmail(order) {
        // Placeholder for EmailJS integration. Replace SERVICE_ID, TEMPLATE_ID, USER_ID.
        return new Promise((resolve, reject) => {
            if (window.emailjs && emailjs.send) {
                const serviceId = 'YOUR_SERVICE_ID';
                const templateId = 'YOUR_TEMPLATE_ID';
                const payload = { order: JSON.stringify(order) };
                emailjs.send(serviceId, templateId, payload)
                    .then(resp => resolve(resp))
                    .catch(err => reject(err));
            } else {
                // EmailJS not configured — resolve so UI proceeds; owner can still see saved order in localStorage.
                resolve({ ok: true, note: 'emailjs-not-configured' });
            }
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function (ev) {
            ev.preventDefault();

            const cart = loadCart();
            if (!cart.items || cart.items.length === 0) {
                alert('Your cart is empty');
                closeCheckout();
                return;
            }

            const name = document.getElementById('cust-name').value.trim();
            const email = document.getElementById('cust-email').value.trim();
            const address = document.getElementById('cust-address').value.trim();
            const phone = document.getElementById('cust-phone').value.trim();
            const card = document.getElementById('pay-card').value.trim();
            const exp = document.getElementById('pay-exp').value.trim();
            const cvc = document.getElementById('pay-cvc').value.trim();
            const notes = document.getElementById('order-notes').value.trim();

            if (!name || !email || !address || !card || !exp || !cvc) {
                alert('Please fill in the required fields.');
                return;
            }

            const totals = computeTotals(cart);

            const order = {
                id: 'ord_' + Date.now(),
                createdAt: new Date().toISOString(),
                customer: { name, email, address, phone },
                payment: { card: '**** **** **** ' + card.slice(-4), exp, cvc: '***' },
                notes,
                items: cart.items,
                totals
            };

            // add status and estimated delivery
            order.status = 'Processing';
            const days = 3 + Math.floor(Math.random() * 5); // 3-7 days
            order.estimatedDelivery = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

            // Save locally for owner view first
            saveOrderLocally(order);

            // attach to user account (if logged in)
            addOrderToUser(order);

            // attempt to send via EmailJS (if configured)
            sendOrderEmail(order)
                .then(() => {
                    // show success message in modal
                    if (checkoutForm) checkoutForm.style.display = 'none';
                    if (checkoutResult) checkoutResult.removeAttribute('hidden');

                    // clear cart
                    sessionStorage.removeItem('cart');
                    updateCartUI();
                })
                .catch(err => {
                    console.error('Email send failed', err);
                    if (checkoutForm) checkoutForm.style.display = 'none';
                    if (checkoutResult) checkoutResult.removeAttribute('hidden');
                    sessionStorage.removeItem('cart');
                    updateCartUI();
                });
        });
    }

    // initialize UI from storage
    updateCartUI();

    // ===================================
    // SIMPLE AUTH / ACCOUNT (client-side demo)
    // ===================================

    function getUsers() {
        const raw = localStorage.getItem('users');
        return raw ? JSON.parse(raw) : [];
    }

    function saveUsers(users) {
        localStorage.setItem('users', JSON.stringify(users));
    }

    function getCurrentUserEmail() {
        return localStorage.getItem('currentUser') || null;
    }

    function setCurrentUserEmail(email) {
        if (email) localStorage.setItem('currentUser', email);
        else localStorage.removeItem('currentUser');
        renderAccountControls();
    }

    function getCurrentUser() {
        const email = getCurrentUserEmail();
        if (!email) return null;
        return getUsers().find(u => u.email === email) || null;
    }

    function saveCurrentUser(user) {
        const users = getUsers();
        const idx = users.findIndex(u => u.email === user.email);
        if (idx >= 0) users[idx] = user;
        else users.unshift(user);
        saveUsers(users);
        setCurrentUserEmail(user.email);
    }

    function renderAccountControls() {
        const mount = document.getElementById('account-controls');
        if (!mount) return;
        mount.innerHTML = '';
        const user = getCurrentUser();
        if (user) {
            const name = document.createElement('span');
            name.className = 'account-name';
            name.textContent = user.name.split(' ')[0];
            mount.appendChild(name);

            const acct = document.createElement('a');
            acct.href = './account.html';
            acct.className = 'account-btn';
            acct.textContent = 'My Orders';
            mount.appendChild(acct);

            const out = document.createElement('button');
            out.className = 'account-btn';
            out.textContent = 'Logout';
            out.addEventListener('click', () => { setCurrentUserEmail(null); });
            mount.appendChild(out);
        } else {
            const btn = document.createElement('button');
            btn.className = 'account-btn';
            btn.textContent = 'Login / Register';
            btn.addEventListener('click', showAuthModal);
            mount.appendChild(btn);
        }
    }

    function showAuthModal() {
        // build modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'auth-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <h3>Account</h3>
            <div>
              <button id="tab-login">Login</button>
              <button id="tab-register">Register</button>
            </div>
            <div id="auth-forms" style="margin-top:0.6rem;"></div>
            <div class="auth-actions"><button id="auth-close">Close</button></div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const forms = modal.querySelector('#auth-forms');

        function renderLogin() {
            forms.innerHTML = `
              <label>Email</label>
              <input id="log-email" type="email" />
              <label>Password</label>
              <input id="log-pass" type="password" />
              <div style="margin-top:0.6rem;text-align:right;"><button id="do-login">Login</button></div>
            `;
            modal.querySelector('#do-login').addEventListener('click', () => {
                const email = modal.querySelector('#log-email').value.trim();
                const pass = modal.querySelector('#log-pass').value.trim();
                if (!email || !pass) { alert('Enter email and password'); return; }
                const user = getUsers().find(u => u.email === email);
                if (!user || user.password !== pass) { alert('Invalid credentials'); return; }
                setCurrentUserEmail(user.email);
                document.body.removeChild(overlay);
            });
        }

        function renderRegister() {
            forms.innerHTML = `
              <label>Full name</label>
              <input id="reg-name" type="text" />
              <label>Email</label>
              <input id="reg-email" type="email" />
              <label>Password</label>
              <input id="reg-pass" type="password" />
              <div style="margin-top:0.6rem;text-align:right;"><button id="do-register">Create account</button></div>
            `;
            modal.querySelector('#do-register').addEventListener('click', () => {
                const name = modal.querySelector('#reg-name').value.trim();
                const email = modal.querySelector('#reg-email').value.trim();
                const pass = modal.querySelector('#reg-pass').value.trim();
                if (!name || !email || !pass) { alert('Fill all fields'); return; }
                const users = getUsers();
                if (users.find(u => u.email === email)) { alert('Email already registered'); return; }
                const newUser = { name, email, password: pass, orders: [] };
                users.unshift(newUser);
                saveUsers(users);
                setCurrentUserEmail(email);
                document.body.removeChild(overlay);
            });
        }

        modal.querySelector('#tab-login').addEventListener('click', renderLogin);
        modal.querySelector('#tab-register').addEventListener('click', renderRegister);
        modal.querySelector('#auth-close').addEventListener('click', () => { document.body.removeChild(overlay); });

        // default
        renderLogin();
    }

    // render account controls initially
    renderAccountControls();

    // enhance checkout flow: attach order to user if logged in and add status/eta
    function addOrderToUser(order) {
        const user = getCurrentUser();
        if (!user) return;
        user.orders = user.orders || [];
        user.orders.unshift(order);
        saveCurrentUser(user);
    }


    // ===================================
    // CUSTOM ORDER FORM VALIDATION
    // ===================================

    const customForm = document.querySelector("#custom form");

    if (customForm) {

        customForm.addEventListener("submit", function(event) {

            const name =
                document.getElementById("name").value.trim();

            const email =
                document.getElementById("email").value.trim();

            const itemType =
                document.getElementById("item-type").value;

            const size =
                document.getElementById("size").value;

            let errors = [];

            if (name === "") {
                errors.push("Name cannot be empty");
            }

            if (email === "") {
                errors.push("Email cannot be empty");
            }

            if (!email.includes("@")) {
                errors.push("Enter a valid email address");
            }

            if (itemType === "") {
                errors.push("Select an item type");
            }

            if (size === "") {
                errors.push("Select a clothing size");
            }

            if (errors.length > 0) {

                event.preventDefault();

                alert(errors.join("\n"));

            } else {

                alert("Custom order submitted successfully!");

            }

        });

    }


    // ===================================
    // CONTACT FORM VALIDATION
    // ===================================

    const contactForm = document.querySelector("#contact form");

    if (contactForm) {

        contactForm.addEventListener("submit", function(event) {

            const name =
                document.getElementById("contact-name").value.trim();

            const email =
                document.getElementById("contact-email").value.trim();

            const subject =
                document.getElementById("contact-subject").value;

            const message =
                document.getElementById("contact-message").value.trim();

            let errors = [];

            if (name === "") {
                errors.push("Name cannot be empty");
            }

            if (email === "") {
                errors.push("Email cannot be empty");
            }

            if (!email.includes("@")) {
                errors.push("Enter a valid email address");
            }

            if (subject === "") {
                errors.push("Select a subject");
            }

            if (message === "") {
                errors.push("Message cannot be empty");
            }

            // prevent actual submit in demo and show inline result
            event.preventDefault();

            // ensure result container exists
            let resultEl = document.getElementById('contact-result');
            if (!resultEl) {
                resultEl = document.createElement('div');
                resultEl.id = 'contact-result';
                resultEl.style.marginTop = '0.6rem';
                resultEl.style.fontWeight = '700';
                contactForm.parentNode.insertBefore(resultEl, contactForm.nextSibling);
            }

            if (errors.length > 0) {
                resultEl.textContent = errors.join(' — ');
                resultEl.style.color = 'crimson';
            } else {
                resultEl.textContent = 'Message sent';
                resultEl.style.color = 'green';
                contactForm.reset();
            }

        });

    }


    // ===================================
    // NUMBER VALIDATION
    // ===================================

    const budgetField = document.getElementById("budget");

    if (budgetField) {

        budgetField.addEventListener("change", () => {

            console.log("Budget selected:", budgetField.value);

        });

    }


    // ===================================
    // ACTIVE PAGE HIGHLIGHT
    // ===================================

    const currentPage =
        window.location.pathname.split("/").pop();

    const links =
        document.querySelectorAll("nav a");

    links.forEach(link => {

        if (link.getAttribute("href") === "./" + currentPage) {

            link.classList.add("active");

        }

    });

});

