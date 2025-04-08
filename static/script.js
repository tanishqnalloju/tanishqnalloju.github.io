document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav a'); // Select all links in the mobile nav
    const scrollDownIndicator = document.querySelector('.scroll-down-indicator'); // Get the scroll down icon
    const heroSection = document.getElementById('hero');
    const experienceSection = document.getElementById('experience');
    const contactButton = document.getElementById('sendMessageBtn');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const resumeOverlay = document.getElementById("resumeOverlay");
    const pdfOverlay = document.getElementById("pdfOverlay");
    const closePdfOverlay = document.getElementById("closePdfOverlay");

    // //Mail Functionality
    const recipientEmail = 'tanishq.nalloju@gmail.com';
    const subjectPostfix = 'PAGE_CONTACT_CTA_INTEREST';
  
    hamburger.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });
  
    // Add event listeners to each mobile navigation link to auto-close
    mobileNavLinks.forEach((link) => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open'); // Remove the 'open' class to close the menu
      });
    });
  
    // Add event listener to the background of the mobile nav to close it
    mobileNav.addEventListener('click', (event) => {
      if (event.target === mobileNav) {
        // Check if the click target is the mobileNav itself (the background)
        mobileNav.classList.remove('open');
      }
    });
  
    // Add event listener to the scroll down indicator
    if (scrollDownIndicator) {
      scrollDownIndicator.addEventListener('click', () => {
        if (experienceSection) {
          experienceSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    contactButton.addEventListener('click', () => {
      const nameValue = document.getElementById('name').value;
      const subjectValue = document.getElementById('subject').value;
      const bodyValue = document.getElementById('message').value;
      const fullSubject = `${subjectValue}: ${subjectPostfix}`;
      // Construct the email body
      const emailBody = `${bodyValue}\n\nRegards,\n${nameValue}`;
      // Construct the mailto: URL
      const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(fullSubject)}&body=${encodeURIComponent(emailBody)}`;
      // Optionally, you can add a message to the user
      // alert('Your email client will now open with a pre-filled message.');
      // openModal();
      document.getElementById('modalOverlay').style.display = 'flex'; // Use flex to center
      document.getElementById('modal').style.display = 'block';
      // closeModal();

      // Open the email client
      window.location.href = mailtoUrl;
      // Optionally, you can clear the form after attempting to open the email client
      const contactForm = document.getElementById('contactForm'); // Assuming your form has the ID 'contactForm'
      if (contactForm) {
        contactForm.reset();
      }
    });

    modalCloseBtn.addEventListener('click', () => {
      document.getElementById('modalOverlay').style.display = 'none';
      document.getElementById('modal').style.display = 'none';
    });    

    resumeOverlay.addEventListener('click', () => {
      pdfOverlay.style.display = "flex";
    }); 

    closePdfOverlay.addEventListener('click', () => {
      pdfOverlay.style.display = "none";
    }); 

    // Close the overlay if the user clicks outside of it
    window.addEventListener('click', function(event) {
      if (event.target == pdfOverlay) {
        pdfOverlay.style.display = "none";
      }
    });
    
  //   // Prevent default behavior of the original Resume link (opening in a new tab)
  //   document.addEventListener('DOMContentLoaded', function() {
  //     const resumeLink = document.querySelector('header nav ul li a[aria-label="Resume"]');
  //     if (resumeLink) {
  //         resumeLink.addEventListener('click', function(event) {
  //             event.preventDefault(); // Prevent the default link behavior
  //             pdfOverlay.style.display = "flex";
  //         });
  //     }
  //     const mobileResumeLink = document.querySelector('.mobile-nav ul li a[aria-label="Resume"]');
  //     if (mobileResumeLink) {
  //         mobileResumeLink.addEventListener('click', function(event) {
  //             event.preventDefault(); // Prevent the default link behavior
  //             pdfOverlay.style.display = "none";
  //         });
  //     }
  // });

});