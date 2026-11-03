/**
 * ============================================================================
 * FILE: js/script.js
 * DESCRIPTION: Application Controller for Image Polytechnic Institute
 * DEPENDENCIES: jQuery 3.x+, js/modals.js (SOLID Functional Architecture)
 * ============================================================================
 */

$(function () {
  console.log("Image Polytechnic Institute UI initialized with jQuery:", $.fn.jquery);

  // ==========================================================================
  // Dynamic Fixed Header Height Synchronizer
  // Measures the exact rendered height of the fixed header and updates CSS
  // variables so body padding and scroll padding are always pixel-perfect.
  // ==========================================================================
  const $headerWrapper = $("#headerWrapper");

  function syncHeaderHeight() {
    if ($headerWrapper.length) {
      const headerHeight = $headerWrapper.outerHeight();
      document.documentElement.style.setProperty("--header-total-h", `${headerHeight}px`);
    }
  }

  // Initial calculation and listener for window resize
  syncHeaderHeight();
  $(window).on("resize orientationchange", syncHeaderHeight);

  // ==========================================================================
  // 1. Dark / Light Theme Mode Toggle
  // ==========================================================================
  const $themeToggle = $("#themeToggle");
  const $themeIcon = $themeToggle.find("i");

  $themeToggle.on("click", function () {
    $("body").toggleClass("light");

    if ($("body").hasClass("light")) {
      $themeIcon.removeClass("fa-moon").addClass("fa-sun");
      $themeToggle.attr("title", "Switch to Dark Mode");
    } else {
      $themeIcon.removeClass("fa-sun").addClass("fa-moon");
      $themeToggle.attr("title", "Switch to Light Mode");
    }
  });

  // ==========================================================================
  // 2. Language Switcher (Bangla <-> English)
  // ==========================================================================
  const $langToggle = $("#langToggle");
  const $langText = $("#langText");
  let currentLang = "en"; // Current display language

  $langToggle.on("click", function () {
    currentLang = currentLang === "en" ? "bn" : "en";
    $langText.text(currentLang === "en" ? "বাং" : "EN");

    // Toggle navigation labels based on data-en and data-bn attributes
    $(".nav-item").each(function () {
      const $link = $(this);
      const translated = $link.data(currentLang);
      if (translated) {
        $link.text(translated);
      }
    });
  });

  // ==========================================================================
  // 3. Mobile Navigation Menu Toggle
  // ==========================================================================
  const $mobileMenuToggle = $("#mobileMenuToggle");
  const $mainNav = $("#mainNav");

  $mobileMenuToggle.on("click", function () {
    $mainNav.toggleClass("mobile-active");
    syncHeaderHeight();
  });

  // Close mobile navigation when a nav link is clicked
  $(".nav-item").on("click", function () {
    $(".nav-item").removeClass("active");
    $(this).addClass("active");
    $mainNav.removeClass("mobile-active");
    syncHeaderHeight();
  });

  // ==========================================================================
  // 4. Student Portal Dialog Trigger (Using Functional showPrompt & showAlert)
  // ==========================================================================
  $("#btnStudentPortal").on("click", async function () {
    const rollNumber = await showPrompt({
      title: "Student Portal Login",
      message: "Please enter your 6-digit BTEB Class Roll or Registration Number:",
      placeholder: "e.g. 518920",
      submitText: "Access Portal",
      cancelText: "Cancel",
      type: "info"
    });

    if (rollNumber) {
      await showAlert({
        title: "Welcome to Student Portal",
        message: `Authenticated successfully for Student Roll: <strong>${$("<div>").text(rollNumber).html()}</strong>.<br><br>Semester: <strong>5th Semester (Computer)</strong><br>Status: <strong>Regular Active</strong><br>Upcoming Exam: <strong>Semester Final Exam 2026</strong>.`,
        type: "success",
        buttonText: "Open Dashboard"
      });
    }
  });

  // ==========================================================================
  // 5. Admission Application Trigger (Header & Hero Buttons)
  // ==========================================================================
  async function triggerAdmissionProcess(preselectedProgram = "") {
    const applicantName = await showPrompt({
      title: "Online Admission Application",
      message: preselectedProgram 
        ? `Apply for <strong>${preselectedProgram}</strong>. Please enter your Full Name & Mobile Number:`
        : "Apply for 4-Year Diploma Engineering (Session 2026-27). Please enter your Full Name & Mobile Number:",
      placeholder: "e.g. Arman Hossain - 017XXXXXXXX",
      submitText: "Submit Application",
      cancelText: "Cancel",
      type: "default"
    });

    if (applicantName) {
      await showAlert({
        title: "Application Received!",
        message: `Thank you, <strong>${$("<div>").text(applicantName).html()}</strong>!<br><br>Your preliminary admission request has been logged. Our Admission Office will call you within 24 hours with scholarship and batch details.`,
        type: "success",
        buttonText: "Done"
      });
    }
  }

  // Bind to Header Apply button and Hero Apply button
  $("#btnHeaderApply, #btnHeroApply").on("click", function () {
    triggerAdmissionProcess();
  });

  // Bind to each program card's "Apply for This Course" button
  $(".btn-prog-apply").on("click", function () {
    const programName = $(this).data("program");
    triggerAdmissionProcess(programName);
  });

  // ==========================================================================
  // 6. Leadership Messages Modal Handlers (Chairman & Principal)
  // ==========================================================================
  $("#btnChairmanMsg").on("click", async function () {
    await showAlert({
      title: "Message from the Chairman",
      message: `
        <strong>Engr. Md. Almamun Akhtaruzzaman</strong><br>
        <em>Chairman, Image Polytechnic Institute</em><br><br>
        "Technical and vocational training is the backbone of any advancing nation. At Image Polytechnic Institute, our vision has always been to bridge the gap between academic textbooks and real-world industrial machinery. With our dedicated faculty, modern high-tech labs, and direct industrial collaboration, we mold creative thinkers and certified engineers who lead Bangladesh into the Fourth Industrial Revolution."
      `,
      type: "info",
      buttonText: "Close"
    });
  });

  $("#btnPrincipalMsg").on("click", async function () {
    await showAlert({
      title: "Message from the Principal",
      message: `
        <strong>Engr. Md. Mokbular Rahman</strong><br>
        <em>Principal, Image Polytechnic Institute</em><br><br>
        "Welcome to Image Polytechnic Institute, Rangpur. We place the highest priority on hands-on practical competence, analytical problem-solving, and personal discipline. Our state-of-the-art campus, computer networking labs, machine workshops, and dedicated placement cell ensure that every student graduates with industry-recognized certifications and clear career prospects."
      `,
      type: "info",
      buttonText: "Close"
    });
  });
});
