/**
 * ============================================================================
 * FILE: js/script.js
 * DESCRIPTION: Application Controller & Modal Triggers
 * DEPENDENCIES: jQuery 3.x+, js/modals.js
 * ============================================================================
 * 
 * DESIGN HIGHLIGHT (Dependency Inversion Principle):
 * This file acts as the high-level application client. It consumes the
 * abstract pop-up functions provided by `js/modals.js` (`showAlert`,
 * `showConfirm`, `showPrompt`) via modern `async/await`. It never directly
 * queries, mounts, or alters the modal DOM nodes.
 * ============================================================================
 */

// Wait for the full DOM tree to be ready before binding events
$(function () {
  // Confirm jQuery initialization and version in developer console
  console.log("jQuery initialized with version:", $.fn.jquery);

  // Cache jQuery selector reference for the activity log container
  const $logContainer = $("#action-log");

  /**
   * Prepends a formatted event entry to the visual action log on screen.
   * 
   * @param {string} type - Entry category for color coding ("info" | "success" | "warning" | "danger").
   * @param {string} title - Label describing which modal or event triggered the log.
   * @param {string} message - Description of the user interaction or returned value.
   */
  function logResult(type, title, message) {
    // Generate formatted local timestamp (HH:MM:SS)
    const time = new Date().toLocaleTimeString();

    // Construct the log entry HTML markup
    const entryHtml = `
      <div class="log-entry log-${type}">
        <span class="log-time">[${time}]</span>
        <strong>${title}:</strong> ${message}
      </div>
    `;

    // Prepend entry to top of the log panel so latest action appears first
    $logContainer.prepend(entryHtml);
  }

  // ==========================================================================
  // Trigger 1: Alert Pop-up
  // ==========================================================================
  // When user clicks the "Alert Pop-up" button, invoke `showAlert()`.
  // Execution pauses at `await` until the user clicks "Got it" or dismisses.
  $("#btn-alert").on("click", async function () {
    const result = await showAlert({
      title: "Operation Successful",
      message: "Your profile changes and settings have been safely synchronized to the server.",
      type: "success",
      buttonText: "Got it"
    });

    // Log the user acknowledgment event
    logResult("info", "Alert Pop-up", "User acknowledged the information dialog.");
  });

  // ==========================================================================
  // Trigger 2: Confirmation Pop-up
  // ==========================================================================
  // When user clicks the "Confirm Pop-up" button, invoke `showConfirm()`.
  // Resolves with a boolean:
  // - `true`  => user clicked affirmative action ("Yes, Delete")
  // - `false` => user clicked "Cancel" or dismissed via backdrop/Escape
  $("#btn-confirm").on("click", async function () {
    const isConfirmed = await showConfirm({
      title: "Delete Workspace Item?",
      message: "Are you sure you want to permanently delete this record? This action cannot be undone.",
      type: "danger",
      confirmText: "Yes, Delete",
      cancelText: "Cancel"
    });

    // Branch logic based on the boolean resolution
    if (isConfirmed === true) {
      logResult("danger", "Confirm Pop-up", "User confirmed action (Proceed with deletion).");
    } else {
      logResult("warning", "Confirm Pop-up", "User canceled or dismissed the confirmation.");
    }
  });

  // ==========================================================================
  // Trigger 3: Prompt (Input) Pop-up
  // ==========================================================================
  // When user clicks the "Prompt Pop-up" button, invoke `showPrompt()`.
  // Resolves with:
  // - string => user entered text and clicked "Save Name" or pressed Enter
  // - null   => user clicked "Cancel" or dismissed the modal
  $("#btn-prompt").on("click", async function () {
    const userInput = await showPrompt({
      title: "Rename Project",
      message: "Please enter a new name for your project directory:",
      placeholder: "e.g. My NextGen Application",
      defaultValue: "",
      submitText: "Save Name",
      cancelText: "Cancel",
      type: "default"
    });

    // Check if the user submitted a valid value vs cancelled
    if (userInput !== null) {
      // Escape HTML entities to prevent XSS when rendering user input to the DOM
      const sanitized = $("<div>").text(userInput).html();
      logResult("success", "Prompt Pop-up", `User submitted: "<strong>${sanitized}</strong>"`);
    } else {
      logResult("warning", "Prompt Pop-up", "User canceled prompt input.");
    }
  });
});
