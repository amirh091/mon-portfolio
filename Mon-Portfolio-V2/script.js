/* ============================================
   Portfolio — Cheikh Dev
   Chargé avec `defer` : le DOM est prêt à l'exécution.
   Tout est isolé dans une IIFE (aucune variable globale).
   ============================================ */
'use strict';

(() => {
    // ------------------------------------------------------------
    // Configuration
    // ------------------------------------------------------------
    // La clé publique et les IDs EmailJS sont publics par conception :
    // la protection se fait côté tableau de bord EmailJS (voir notes).
    const EMAILJS = {
        publicKey: 'HtM170biyzGNXrdQA',
        serviceId: 'service_n6ljzid',
        templateId: 'template_o81l8aj',
    };
    const FORM_COOLDOWN_MS = 30000;   // délai minimum entre deux envois
    const FORM_TIMEOUT_MS = 15000;    // abandon si EmailJS ne répond pas
    const NAV_BREAKPOINT = '(min-width: 1100px)';

    // ------------------------------------------------------------
    // Utilitaires
    // ------------------------------------------------------------
    const $ = (selector, ctx = document) => ctx.querySelector(selector);
    const $$ = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector));

    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktopNav = window.matchMedia(NAV_BREAKPOINT);

    // localStorage peut lever une exception (navigation privée, cookies bloqués…)
    const storage = {
        get(key) { try { return localStorage.getItem(key); } catch { return null; } },
        set(key, value) { try { localStorage.setItem(key, value); } catch { /* ignoré */ } },
    };

    // ------------------------------------------------------------
    // 1. Barre de navigation : état « scrollé »
    //    (un seul listener passif, limité à 1 exécution par frame)
    // ------------------------------------------------------------
    function initNavbar() {
        const navbar = $('#navbar');
        if (!navbar) return;

        let ticking = false;
        const update = () => {
            navbar.classList.toggle('is-scrolled', window.scrollY > 60);
            ticking = false;
        };
        window.addEventListener('scroll', () => {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        }, { passive: true });
        update();
    }

    // ------------------------------------------------------------
    // 2. Menu mobile (tiroir accessible)
    // ------------------------------------------------------------
    function initMobileMenu() {
        const toggle = $('#menu-toggle');
        const menu = $('#nav-menu');
        if (!toggle || !menu) return;
        const icon = $('i', toggle);

        const setOpen = (open) => {
            menu.classList.toggle('is-open', open);
            document.body.classList.toggle('menu-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
            if (icon) {
                icon.classList.toggle('fa-xmark', open);
                icon.classList.toggle('fa-bars', !open);
            }
        };
        const isOpen = () => menu.classList.contains('is-open');

        toggle.addEventListener('click', () => setOpen(!isOpen()));

        // Fermeture : clic sur un lien, clic à l'extérieur, touche Échap
        menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
        document.addEventListener('pointerdown', (e) => {
            if (isOpen() && !menu.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen()) { setOpen(false); toggle.focus(); }
        });

        // Passage en mode bureau avec le menu ouvert : on réinitialise l'état
        desktopNav.addEventListener('change', (e) => { if (e.matches) setOpen(false); });
    }

    // ------------------------------------------------------------
    // 3. Section active (points + liens de navigation)
    //    IntersectionObserver au lieu de getBoundingClientRect() à chaque scroll
    // ------------------------------------------------------------
    function initActiveSection() {
        const dots = $$('.scroll-dot');
        const links = $$('.nav-list a');
        if (!('IntersectionObserver' in window) || !dots.length) return;

        const setActive = (id) => {
            [...dots, ...links].forEach((el) => {
                const match = el.getAttribute('href') === `#${id}`;
                el.classList.toggle('is-active', match);
                if (match) el.setAttribute('aria-current', 'true');
                else el.removeAttribute('aria-current');
            });
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); });
        }, { rootMargin: '-50% 0px -50% 0px' }); // la ligne médiane de l'écran fait foi

        dots.forEach((dot) => {
            const section = document.getElementById(dot.getAttribute('href').slice(1));
            if (section) observer.observe(section);
        });
    }

    // ------------------------------------------------------------
    // 4. Apparition au scroll
    // ------------------------------------------------------------
    function initReveal() {
        const items = $$('.reveal');
        if (!items.length) return;

        if (!('IntersectionObserver' in window)) return; // tout reste visible
        root.classList.add('reveal-ready');
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target); // inutile de continuer à observer
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        items.forEach((el) => observer.observe(el));
    }

    // ------------------------------------------------------------
    // 5. Fenêtre de code défilante
    //    Construite avec createElement/textContent (pas d'innerHTML, pas de &nbsp;)
    // ------------------------------------------------------------
    function initCodeWindow() {
        const container = $('#scrolling-code');
        if (!container) return;

        // [classe CSS | null, texte]
        const LINES = [
            [['keyword', 'const'], [null, ' '], ['function', 'creerProjet'], [null, ' = ('], ['string', 'idee'], [null, ') => {']],
            [[null, '  '], ['keyword', 'let'], [null, ' magie = '], ['string', '"opère"'], [null, ';']],
            [[null, '  '], ['keyword', 'return'], [null, ' idee + '], ['string', '" + pratique = réalisé"'], [null, ';']],
            [[null, '};']],
            [['comment', '// Initialisation de Cheikh Dev...']],
            [['function', 'console'], [null, '.log('], ['string', '"Prêt à coder !"'], [null, ');']],
            [['keyword', 'async function'], [null, ' '], ['function', 'deployer'], [null, '() {']],
            [[null, '  '], ['keyword', 'await'], [null, ' netlify.deploy('], ['string', '"succès"'], [null, ');']],
            [[null, '}']],
            [['comment', '// Boucle infinie de créativité']],
            [['keyword', 'while'], [null, ' (cafe > 0) {']],
            [[null, '  coder();']],
            [[null, '}']],
        ];

        const buildCopy = () => {
            const copy = document.createElement('div');
            LINES.forEach((tokens) => {
                const line = document.createElement('div');
                line.className = 'code-line';
                tokens.forEach(([cls, text]) => {
                    if (cls) {
                        const span = document.createElement('span');
                        span.className = cls;
                        span.textContent = text;
                        line.appendChild(span);
                    } else {
                        line.appendChild(document.createTextNode(text));
                    }
                });
                copy.appendChild(line);
            });
            return copy;
        };

        // Deux copies identiques : la translation de -50 % boucle sans saut visible
        const track = document.createElement('div');
        track.className = 'code-track';
        track.append(buildCopy(), buildCopy());
        container.replaceChildren(track);
    }

    // ------------------------------------------------------------
    // 6. Formulaire de contact (EmailJS)
    // ------------------------------------------------------------
    function initContactForm() {
        const form = $('#contact-form');
        const button = $('#submit-btn');
        const status = $('#form-status');
        if (!form || !button || !status) return;

        const btnIcon = $('i', button);
        const btnLabel = $('.btn-label', button);
        let sending = false;
        let lastSentAt = 0;

        if (typeof emailjs !== 'undefined') {
            emailjs.init({ publicKey: EMAILJS.publicKey });
        }

        const setStatus = (message, type) => {
            status.textContent = message;               // textContent : jamais d'injection HTML
            status.className = 'form-status' + (type ? ` is-${type}` : '');
        };

        const setSending = (value) => {
            sending = value;
            button.disabled = value;
            button.setAttribute('aria-busy', String(value));
            if (btnIcon) btnIcon.className = value ? 'fas fa-spinner fa-spin' : 'fas fa-paper-plane';
            if (btnLabel) btnLabel.textContent = value ? 'Envoi en cours…' : 'Envoyer le message';
        };

        const withTimeout = (promise, ms) => {
            let timer;
            const timeout = new Promise((_, reject) => {
                timer = setTimeout(() => reject(new Error('timeout')), ms);
            });
            return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
        };

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (sending) return;

            // Honeypot : un humain ne voit pas ce champ. On simule un succès pour ne rien apprendre au robot.
            if (form.elements.website && form.elements.website.value) {
                form.reset();
                setStatus('Message envoyé avec succès !', 'success');
                return;
            }

            // Nettoyage + validation native (types, longueurs, champs requis)
            ['name', 'email', 'subject', 'message'].forEach((field) => {
                const el = form.elements[field];
                if (el) el.value = el.value.trim();
            });
            if (!form.checkValidity()) { form.reportValidity(); return; }

            // Anti-spam : délai minimum entre deux envois
            const remaining = FORM_COOLDOWN_MS - (Date.now() - lastSentAt);
            if (remaining > 0) {
                setStatus(`Merci de patienter ${Math.ceil(remaining / 1000)} s avant un nouvel envoi.`, 'error');
                return;
            }

            // Le SDK peut être bloqué (réseau, extension) : on ne laisse pas le bouton bloqué
            if (typeof emailjs === 'undefined') {
                setStatus('Le service d’envoi est indisponible. Écrivez-moi directement par e-mail.', 'error');
                return;
            }

            setSending(true);
            setStatus('');

            try {
                await withTimeout(emailjs.sendForm(EMAILJS.serviceId, EMAILJS.templateId, form), FORM_TIMEOUT_MS);
                lastSentAt = Date.now();
                form.reset();
                setStatus('Message envoyé avec succès ! Je vous recontacterai bientôt.', 'success');
            } catch (err) {
                console.error('Erreur EmailJS :', err);
                let message = 'Erreur lors de l’envoi. Veuillez réessayer ou m’écrire par e-mail.';
                if (err && err.message === 'timeout') message = 'Le serveur met trop de temps à répondre. Veuillez réessayer.';
                else if (err && err.status === 429) message = 'Trop de demandes. Veuillez réessayer dans quelques minutes.';
                setStatus(message, 'error');
            } finally {
                setSending(false);
            }
        });
    }

    // ------------------------------------------------------------
    // 7. Thème sombre / clair
    //    La valeur initiale est posée par le script inline du <head> (aucun flash).
    // ------------------------------------------------------------
    function initTheme() {
        const toggle = $('#theme-toggle');
        if (!toggle) return;
        const icon = $('i', toggle);
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

        const apply = (theme, persist) => {
            const dark = theme === 'dark';
            root.dataset.theme = theme;
            toggle.setAttribute('aria-pressed', String(dark));
            toggle.setAttribute('aria-label', dark ? 'Activer le thème clair' : 'Activer le thème sombre');
            if (icon) {
                icon.classList.toggle('fa-sun', dark);
                icon.classList.toggle('fa-moon', !dark);
            }
            if (persist) storage.set('theme', theme);
        };

        apply(root.dataset.theme === 'dark' ? 'dark' : 'light', false);

        toggle.addEventListener('click', () => {
            apply(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
        });

        // Suit le réglage du système tant que l'utilisateur n'a pas choisi manuellement
        systemDark.addEventListener('change', (e) => {
            if (!storage.get('theme')) apply(e.matches ? 'dark' : 'light', false);
        });
    }

    // ------------------------------------------------------------
    // 9. Particules (uniquement quand le hero est visible)
    // ------------------------------------------------------------
    function initParticles() {
        const host = $('#particles-js');
        const hero = $('#accueil');
        if (!host || !hero || typeof particlesJS === 'undefined') return;

        const desktop = window.matchMedia('(min-width: 769px)');
        const allowed = () => desktop.matches && !reducedMotion.matches;
        let running = false;

        const start = () => {
            if (running || !allowed()) return;
            particlesJS('particles-js', {
                particles: {
                    number: { value: 60, density: { enable: true, value_area: 800 } },
                    color: { value: '#34d399' },
                    shape: { type: 'circle' },
                    opacity: { value: 0.3, random: true, anim: { enable: true, speed: 0.5, opacity_min: 0.1 } },
                    size: { value: 3, random: true, anim: { enable: true, speed: 2, size_min: 0.5 } },
                    line_linked: { enable: true, distance: 150, color: '#34d399', opacity: 0.15, width: 1 },
                    move: { enable: true, speed: 1, direction: 'none', random: true, straight: false, out_mode: 'out', bounce: false },
                },
                interactivity: {
                    // "window" : le canvas est sous le contenu du hero, il ne recevrait jamais la souris
                    detect_on: 'window',
                    // Pas de mode "push" : chaque clic ajoutait des particules sans limite
                    events: { onhover: { enable: true, mode: 'grab' }, onclick: { enable: false }, resize: true },
                    modes: { grab: { distance: 140, line_linked: { opacity: 0.4 } } },
                },
                retina_detect: true,
            });
            running = true;
        };

        const stop = () => {
            if (!running) return;
            try {
                const instance = window.pJSDom && window.pJSDom[0];
                if (instance) instance.pJS.fn.vendors.destroypJS();
                window.pJSDom = [];
            } catch (err) {
                console.warn('Arrêt des particules impossible :', err);
            }
            running = false;
        };

        // Économise le CPU/batterie : animation stoppée quand le hero n'est plus à l'écran
        if ('IntersectionObserver' in window) {
            new IntersectionObserver((entries) => {
                const last = entries[entries.length - 1];
                if (last.isIntersecting) start(); else stop();
            }).observe(hero);
        } else {
            start();
        }
        desktop.addEventListener('change', () => { if (!allowed()) stop(); else start(); });
    }

    // ------------------------------------------------------------
    // 10. Divers
    // ------------------------------------------------------------
    function initFooterYear() {
        const year = $('#year');
        if (year) year.textContent = String(new Date().getFullYear());
    }

    // ------------------------------------------------------------
    // Démarrage : chaque module est isolé, une erreur dans l'un
    // n'empêche pas les autres de s'exécuter.
    // ------------------------------------------------------------
    [
        initTheme, initNavbar, initMobileMenu, initActiveSection, initReveal,
        initCodeWindow, initContactForm, initParticles, initFooterYear,
    ].forEach((init) => {
        try { init(); } catch (err) { console.error(`Erreur dans ${init.name} :`, err); }
    });
})();

// ============================================
// ASSISTANT VIRTUEL (CHATBOT)
// ============================================
(function initChatbot() {
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatClose = document.getElementById('chat-close');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');

    // Sécurité : si un élément manque, on sort proprement
    if (!chatToggle || !chatWindow || !chatMessages) {
        console.warn('Chatbot : éléments HTML manquants');
        return;
    }

    // Base de connaissances enrichie du bot
    const botKnowledge = {
        'bonjour': "Bonjour ! 👋 Je suis l'assistant de Cheikh. Comment puis-je vous aider ?",
        'salut': "Salut ! Ravi de vous voir. Que voulez-vous savoir ?",
        'hey': "Hey ! 👋 Bienvenue sur le portfolio de Cheikh.",
        'bonsoir': "Bonsoir ! Comment puis-je vous aider ce soir ?",
        'projets': "Cheikh a réalisé 3 projets majeurs : <br>🚚 <strong>E-Touré Service</strong> (Logistique)<br>🛒 <strong>Fad Boutique</strong> (Gestion de stock)<br>💬 <strong>Saga Chatt</strong> (Messagerie).",
        'projet': "Cheikh a réalisé 3 projets majeurs : <br>🚚 <strong>E-Touré Service</strong> (Logistique)<br>🛒 <strong>Fad Boutique</strong> (Gestion de stock)<br>💬 <strong>Saga Chatt</strong> (Messagerie).",
        'tarif': "Les tarifs dépendent de la complexité du projet. Cheikh propose des solutions sur mesure. Je vous invite à utiliser le formulaire de contact pour un devis gratuit ! 📝",
        'prix': "Les tarifs dépendent de la complexité du projet. Cheikh propose des solutions sur mesure. Je vous invite à utiliser le formulaire de contact pour un devis gratuit ! 📝",
        'cout': "Les tarifs dépendent de la complexité du projet. Cheikh propose des solutions sur mesure. Je vous invite à utiliser le formulaire de contact pour un devis gratuit ! 📝",
        'devis': "Pour obtenir un devis gratuit, utilisez le formulaire de contact en bas de page ou contactez Cheikh directement par WhatsApp ! 📱",
        'contact': "Vous pouvez contacter Cheikh par :<br> Email : faruckh091@gmail.com<br>📱 WhatsApp : +225 07 09 13 36 88<br>Ou via le formulaire en bas de page !",
        'email': "L'email de Cheikh est : faruckh091@gmail.com ",
        'mail': "L'email de Cheikh est : faruckh091@gmail.com 📧",
        'whatsapp': "Le numéro WhatsApp est le +225 07 09 13 36 88 📱",
        'telephone': "Le numéro WhatsApp est le +225 07 09 13 36 88 ",
        'tel': "Le numéro WhatsApp est le +225 07 09 13 36 88 ",
        'competences': "Cheikh maîtrise : HTML5, CSS3, JavaScript, Supabase, Netlify et le Responsive Design. 💻",
        'technologies': "Cheikh utilise : HTML5, CSS3, JavaScript, Supabase, Netlify et le Responsive Design. 💻",
        'stack': "La stack technique de Cheikh : HTML5, CSS3, JavaScript, Supabase, Netlify. 💻",
        'disponible': "Cheikh est disponible pour de nouveaux projets ! Contactez-le pour discuter de vos besoins. 🚀",
        'dispo': "Cheikh est disponible pour de nouveaux projets ! Contactez-le pour discuter de vos besoins. 🚀",
        'freelance': "Oui, Cheikh travaille en freelance et est ouvert aux collaborations ! 🤝",
        'delais': "Les délais dépendent de la complexité du projet. Un site vitrine : 1-2 semaines. Une application web : 3-6 semaines. ⏱️",
        'temps': "Les délais dépendent de la complexité du projet. Un site vitrine : 1-2 semaines. Une application web : 3-6 semaines. ️",
        'blog': "La rubrique Blog présente les sujets que Cheikh prépare autour de ses projets et du développement web. Les articles arrivent prochainement ! 📝",
        'article': "Les premiers articles sont en préparation. Consultez la rubrique Blog pour découvrir les sujets prévus. 📝",
        'tutoriel': "Des tutoriels sont prévus dans la rubrique Blog. Les premiers articles arrivent prochainement. 📚",
        'etoure': "E-Touré Service est une plateforme de transport (déménagement, livraison, dépannage) en France et Belgique, avec automatisation des devis/factures. 🚚",
        'fad': "Fad Boutique est une application de gestion de stock et de caisse avec suivi des clients pro et alertes de péremption. 🛒",
        'saga': "Saga Chatt est une application de messagerie instantanée moderne et fluide, en temps réel. 💬",
        'merci': "Avec plaisir ! N'hésitez pas si vous avez d'autres questions. ",
        'super': "Merci !  N'hésitez pas si vous avez d'autres questions.",
        'genial': "Merci !  N'hésitez pas si vous avez d'autres questions.",
        'parfait': "Ravi de pouvoir aider ! 😊 Autre question ?",
        'au revoir': "Au revoir ! Bonne visite sur le portfolio. 👋",
        'bye': "Au revoir ! Bonne visite sur le portfolio. 👋"
    };

    const defaultResponse = "Je n'ai pas bien compris votre question. 🤔 Essayez de me parler de : <strong>projets</strong>, <strong>tarifs</strong>, <strong>contact</strong>, <strong>compétences</strong>, <strong>disponibilité</strong> ou <strong>délais</strong>.";

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);
        if (sender === 'bot') msgDiv.innerHTML = text;
        else msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addQuickReplies() {
        const repliesDiv = document.createElement('div');
        repliesDiv.classList.add('quick-replies');
        const options = ['Vos projets', 'Vos tarifs', 'Vous contacter'];
        options.forEach(function(opt) {
            const btn = document.createElement('button');
            btn.classList.add('quick-reply-btn');
            btn.textContent = opt;
            btn.onclick = function() {
                handleUserInput(opt);
                repliesDiv.remove();
            };
            repliesDiv.appendChild(btn);
        });
        chatMessages.appendChild(repliesDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function getBotResponse(input) {
        const lowerInput = input.toLowerCase();
        for (let key in botKnowledge) {
            if (lowerInput.includes(key)) {
                return botKnowledge[key];
            }
        }
        return defaultResponse;
    }

    function handleUserInput(text) {
        if (!text.trim()) return;
        addMessage(text, 'user');
        chatInput.value = '';
        setTimeout(function() {
            const response = getBotResponse(text);
            addMessage(response, 'bot');
        }, 600);
    }

    // Événements
    chatToggle.addEventListener('click', function() {
        chatWindow.classList.add('active');
        chatToggle.classList.add('hidden');
        if (chatMessages.children.length === 0) {
            setTimeout(function() {
                addMessage("Bonjour ! 👋 Je suis l'assistant virtuel de Cheikh Dev. Je peux vous renseigner sur ses projets, ses tarifs ou ses coordonnées.", 'bot');
                addQuickReplies();
            }, 500);
        }
    });

    chatClose.addEventListener('click', function() {
        chatWindow.classList.remove('active');
        chatToggle.classList.remove('hidden');
    });

    chatSend.addEventListener('click', function() {
        handleUserInput(chatInput.value);
    });

    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleUserInput(chatInput.value);
        }
    });
})();