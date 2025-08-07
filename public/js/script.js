        // @ts-nocheck
        // Mobile Menu Toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        const overlay = document.getElementById('overlay');

        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
            
            // Change l'icône du bouton
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });

        overlay.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            
            // Remet l'icône hamburger
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });

        // Toggle play/pause for tracks
        function togglePlay(trackId) {
            const icon = document.getElementById(`play-icon-${trackId}`);
            icon.classList.toggle('fa-play');
            icon.classList.toggle('fa-pause');
        }

        // Close mobile menu when clicking on a link
        const navLinks = document.querySelectorAll('.mobile-menu .nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
                
                // Remet l'icône hamburger
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });