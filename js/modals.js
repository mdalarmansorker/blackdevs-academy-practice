/**
 * ============================================================================
 * FILE: js/modals.js
 * DESCRIPTION: Functional Pop-up & Modal Library built on SOLID Principles
 * DEPENDENCIES: jQuery 3.x+
 * ============================================================================
 * 
 * DESIGN PHILOSOPHY:
 * This library implements the SOLID principles using pure JavaScript functions
 * and closures rather than Object-Oriented classes.
 * 
 * 1. Single Responsibility Principle (SRP):
 *    - Each function has one well-defined responsibility:
 *      * getModalIcon()       -> Resolves icon glyphs for modal types.
 *      * renderModalTemplate()-> Compiles HTML markup strings.
 *      * createModal()        -> Manages DOM mounting, animation, and Promise lifecycle.
 *      * showAlert()          -> Configures informational dialogs.
 *      * showConfirm()        -> Configures binary decision dialogs (Yes / No).
 *      * showPrompt()         -> Configures user text input collection and validation.
 * 
 * 2. Open/Closed Principle (OCP):
 *    - `createModal()` is closed for modification, but open for extension.
 *      Developers can introduce brand-new modal types (e.g., Image Gallery,
 *      Multi-step Wizard) simply by providing custom `renderBody`, `renderFooter`,
 *      and `bindEvents` functions without modifying existing library code.
 * 
 * 3. Liskov Substitution Principle (LSP / Behavioral Subtyping):
 *    - All consumer-facing popup functions (`showAlert`, `showConfirm`, `showPrompt`)
 *      follow the identical calling contract: they accept an options configuration
 *      object and return a `Promise`. Any caller can substitute or invoke them
 *      interchangeably using `await`.
 * 
 * 4. Interface Segregation Principle (ISP):
 *    - Pop-up functions do not force callers to provide unused settings.
 *      `showAlert()` only requires text/button settings, whereas `showPrompt()`
 *      segregates input-specific options (placeholder, default value).
 * 
 * 5. Dependency Inversion Principle (DIP):
 *    - High-level application logic depends on abstract functional promises,
 *      completely decoupled from raw jQuery DOM manipulation or selectors.
 * ============================================================================
 */

/**
 * Maps a modal style category to an appropriate visual icon glyph.
 * 
 * @param {string} type - Category key ("info" | "success" | "warning" | "danger" | "default").
 * @returns {string} The corresponding emoji or visual icon string.
 */
function getModalIcon(type) {
  // Dictionary lookup provides O(1) icon retrieval with a safe fallback
  const icons = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    danger: "🚨",
    default: "💬"
  };

  return icons[type] || icons.default;
}

/**
 * Assembles the complete HTML structure for a modal backdrop and card.
 * (Single Responsibility: Only responsible for producing HTML strings)
 * 
 * @param {Object} params - Configuration payload for rendering.
 * @param {string} params.title - Header title text.
 * @param {string} [params.type="default"] - Style variant class for color coding.
 * @param {string} params.bodyHtml - Injected inner HTML for the modal body.
 * @param {string} params.footerHtml - Injected inner HTML for the modal footer actions.
 * @returns {string} Well-formed HTML template string.
 */
function renderModalTemplate({ title, type = "default", bodyHtml, footerHtml }) {
  // Retrieve the icon matching the modal's severity/category
  const icon = getModalIcon(type);

  // Return semantic and accessible HTML using ARIA attributes:
  // - role="dialog": Informs screen readers this is a dialog window
  // - aria-modal="true": Tells assistive tech that background content is inert
  // - tabindex="-1": Ensures backdrop can receive programmatic focus if needed
  return `
    <div class="modal-backdrop" tabindex="-1">
      <div class="modal-container modal-type-${type}" role="dialog" aria-modal="true">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <span class="modal-icon" aria-hidden="true">${icon}</span>
            <h2 class="modal-title">${title}</h2>
          </div>
          <button type="button" class="modal-close-btn" data-action="dismiss" aria-label="Close modal">&times;</button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        <div class="modal-footer">${footerHtml}</div>
      </div>
    </div>
  `;
}

/**
 * Universal Modal Lifecycle Engine.
 * Manages DOM attachment, animations, backdrop locking, event cleanup, and Promise resolution.
 * (Open/Closed Principle: Extensible through hooks without modifying this function)
 * 
 * @param {Object} options - Lifecycle and template configuration.
 * @param {string} [options.title="Notice"] - Title shown in the modal header.
 * @param {string} [options.type="default"] - Color category ("info", "success", "warning", "danger").
 * @param {boolean} [options.closeOnEsc=true] - Whether pressing the Escape key closes the modal.
 * @param {boolean} [options.closeOnBackdrop=true] - Whether clicking the dark backdrop closes the modal.
 * @param {Function} [options.renderBody] - Callback returning HTML string for the modal body.
 * @param {Function} [options.renderFooter] - Callback returning HTML string for the modal footer buttons.
 * @param {Function} [options.bindEvents] - Callback receiving ($overlay, closeModal) to wire up custom events.
 * @returns {Promise<any>} Resolves with the user's action value or null if dismissed.
 */
function createModal({
  title = "Notice",
  type = "default",
  closeOnEsc = true,
  closeOnBackdrop = true,
  renderBody,
  renderFooter,
  bindEvents
}) {
  return new Promise((resolve) => {
    // Step 1: Render custom body and footer snippets through the provided hooks
    const bodyHtml = typeof renderBody === "function" ? renderBody() : "";
    const footerHtml = typeof renderFooter === "function" ? renderFooter() : "";

    // Step 2: Compile the complete markup and wrap it in a jQuery DOM collection
    const html = renderModalTemplate({ title, type, bodyHtml, footerHtml });
    const $overlay = $(html);
    const $modal = $overlay.find(".modal-container");

    /**
     * Internal teardown handler.
     * Reverses animations, cleans up all attached listeners, restores body scrolling,
     * removes DOM nodes to prevent memory leaks, and resolves the outer Promise.
     * 
     * @param {*} result - Value to pass back to the caller who awaited createModal().
     */
    function closeModal(result) {
      // Clean up namespaced keyboard listeners to prevent duplicate triggers
      $(document).off("keydown.modalEsc");

      // Unlock background page scrolling
      $("body").removeClass("modal-open");

      // Trigger exit transition (zoom out modal card, fade out dark overlay)
      $modal.removeClass("modal-animate-in").addClass("modal-animate-out");
      $overlay.animate({ opacity: 0 }, 150, function () {
        // Completely destroy the DOM element from the tree
        $overlay.remove();

        // Resolve the Promise returning control to the caller
        resolve(result);
      });
    }

    // Step 3: Wire up standard dismissal actions (X button click)
    $overlay.on("click", '[data-action="dismiss"]', function () {
      closeModal(null);
    });

    // Step 4: Handle clicking on the backdrop overlay (outside the modal box)
    $overlay.on("click", function (e) {
      // Ensure the click was directly on the backdrop itself, not inside the modal container
      if (closeOnBackdrop && $(e.target).is($overlay)) {
        closeModal(null);
      }
    });

    // Step 5: Handle keyboard accessibility (<kbd>Escape</kbd> key closes topmost modal)
    if (closeOnEsc) {
      // Use namespaced event ".modalEsc" for safe, isolated removal later
      $(document).on("keydown.modalEsc", function (e) {
        if (e.key === "Escape") {
          closeModal(null);
        }
      });
    }

    // Step 6: Invoke specialized event hook (Interface Segregation: delegate custom actions)
    if (typeof bindEvents === "function") {
      bindEvents($overlay, closeModal);
    }

    // Step 7: Prevent background scroll and append modal to document body
    $("body").addClass("modal-open").append($overlay);

    // Step 8: Play enter animation (smooth CSS scale-in and jQuery opacity fade)
    $overlay.css({ display: "flex", opacity: 0 }).animate({ opacity: 1 }, 200);
    $modal.addClass("modal-animate-in");
  });
}

/**
 * ============================================================================
 * Pop-up #1: Alert Dialog
 * ============================================================================
 * Displays an informational notification with a single acknowledgment button.
 * 
 * @param {Object} [options={}] - Customization options.
 * @param {string} [options.title="Information"] - Header title.
 * @param {string} [options.message="This is an alert notice."] - Notification body text.
 * @param {string} [options.type="info"] - Style category ("info", "success", "warning", "danger").
 * @param {string} [options.buttonText="Understood"] - Label for the acknowledgment button.
 * @returns {Promise<boolean|null>} Resolves with true when acknowledged, or null if dismissed.
 * 
 * @example
 * await showAlert({
 *   title: "Payment Received",
 *   message: "Your invoice has been processed successfully.",
 *   type: "success"
 * });
 */
function showAlert({
  title = "Information",
  message = "This is an alert notice.",
  type = "info",
  buttonText = "Understood"
} = {}) {
  return createModal({
    title,
    type,
    // Render body with clean message text
    renderBody: () => `<p>${message}</p>`,
    // Render footer with a single primary acknowledgment button
    renderFooter: () => `
      <button type="button" class="btn btn-primary" data-action="ok">
        ${buttonText}
      </button>
    `,
    // Bind click event on the button to close and resolve with true
    bindEvents: ($overlay, close) => {
      $overlay.on("click", '[data-action="ok"]', () => close(true));

      // Accessibility: Shift focus to the button after animation
      setTimeout(() => $overlay.find('[data-action="ok"]').trigger("focus"), 100);
    }
  });
}

/**
 * ============================================================================
 * Pop-up #2: Confirmation Dialog
 * ============================================================================
 * Displays a prompt with two mutually exclusive choices (e.g. Yes / No, Delete / Cancel).
 * 
 * @param {Object} [options={}] - Customization options.
 * @param {string} [options.title="Please Confirm"] - Header title.
 * @param {string} [options.message="Are you sure you want to proceed?"] - Confirmation prompt.
 * @param {string} [options.type="warning"] - Style category ("warning", "danger", etc.).
 * @param {string} [options.confirmText="Confirm"] - Text for the affirmative action button.
 * @param {string} [options.cancelText="Cancel"] - Text for the cancellation button.
 * @returns {Promise<boolean>} Resolves to `true` if user confirmed, or `false` if canceled/dismissed.
 * 
 * @example
 * const confirmed = await showConfirm({
 *   title: "Remove Member",
 *   message: "Do you want to revoke this user's workspace permissions?",
 *   type: "danger",
 *   confirmText: "Revoke Access"
 * });
 * if (confirmed) { ... }
 */
function showConfirm({
  title = "Please Confirm",
  message = "Are you sure you want to proceed?",
  type = "warning",
  confirmText = "Confirm",
  cancelText = "Cancel"
} = {}) {
  return createModal({
    title,
    type,
    // Render message body
    renderBody: () => `<p>${message}</p>`,
    // Render two action buttons: Cancel (neutral) and Confirm (colored based on danger/warning)
    renderFooter: () => `
      <button type="button" class="btn btn-secondary" data-action="cancel">
        ${cancelText}
      </button>
      <button type="button" class="btn btn-danger" data-action="confirm">
        ${confirmText}
      </button>
    `,
    // Bind both choices to resolve with respective booleans
    bindEvents: ($overlay, close) => {
      // Affirmative action: Resolves true
      $overlay.on("click", '[data-action="confirm"]', () => close(true));

      // Cancellation: Resolves false
      $overlay.on("click", '[data-action="cancel"]', () => close(false));

      // Accessibility: Focus the confirm action for rapid keyboard interaction
      setTimeout(() => $overlay.find('[data-action="confirm"]').trigger("focus"), 100);
    }
  });
}

/**
 * ============================================================================
 * Pop-up #3: Prompt (Input) Dialog
 * ============================================================================
 * Collects and validates a single-line text input from the user.
 * 
 * @param {Object} [options={}] - Customization options.
 * @param {string} [options.title="Input Required"] - Header title.
 * @param {string} [options.message="Please enter the required information:"] - Prompt instructions.
 * @param {string} [options.placeholder="Type here..."] - Input placeholder attribute.
 * @param {string} [options.defaultValue=""] - Pre-populated initial value.
 * @param {string} [options.submitText="Submit"] - Label for the submit button.
 * @param {string} [options.cancelText="Cancel"] - Label for the cancel button.
 * @param {string} [options.type="default"] - Style category.
 * @returns {Promise<string|null>} Resolves with the trimmed string on submission, or null on cancellation.
 * 
 * @example
 * const projectName = await showPrompt({
 *   title: "Create Folder",
 *   message: "Enter the directory name:",
 *   placeholder: "my-new-folder"
 * });
 * if (projectName !== null) { ... }
 */
function showPrompt({
  title = "Input Required",
  message = "Please enter the required information:",
  placeholder = "Type here...",
  defaultValue = "",
  submitText = "Submit",
  cancelText = "Cancel",
  type = "default"
} = {}) {
  return createModal({
    title,
    type,
    // Render prompt body containing the instruction, input field, and inline validation container
    renderBody: () => `
      <p class="modal-text">${message}</p>
      <div class="modal-input-group">
        <input 
          type="text" 
          class="modal-input" 
          placeholder="${placeholder}" 
          value="${defaultValue}"
          autocomplete="off"
        />
        <span class="modal-error-msg" style="display: none;">This field cannot be empty.</span>
      </div>
    `,
    // Render Cancel and Submit action buttons
    renderFooter: () => `
      <button type="button" class="btn btn-secondary" data-action="cancel">
        ${cancelText}
      </button>
      <button type="button" class="btn btn-primary" data-action="submit">
        ${submitText}
      </button>
    `,
    // Handle input validation, key events, and submission
    bindEvents: ($overlay, close) => {
      const $input = $overlay.find(".modal-input");
      const $error = $overlay.find(".modal-error-msg");

      /**
       * Validates user input before closing.
       * If empty, displays an inline error alert. If valid, passes trimmed string to close().
       */
      function handleSubmission() {
        const value = $input.val().trim();

        // Guard: Reject blank input and display visual validation error
        if (!value) {
          $input.addClass("input-invalid");
          $error.slideDown(150);
          $input.trigger("focus");
          return;
        }

        // Successfully close with the entered text
        close(value);
      }

      // Event: Submit button click
      $overlay.on("click", '[data-action="submit"]', handleSubmission);

      // Event: Cancel button click (resolves null)
      $overlay.on("click", '[data-action="cancel"]', () => close(null));

      // Event: Keyboard handling on input field
      $input.on("keydown", function (e) {
        if (e.key === "Enter") {
          // Enter key submits the modal directly
          e.preventDefault();
          handleSubmission();
        } else {
          // Clear error state as soon as user begins typing
          $input.removeClass("input-invalid");
          $error.slideUp(100);
        }
      });

      // Accessibility: Auto-focus the input field so user can type immediately
      setTimeout(() => $input.trigger("focus"), 100);
    }
  });
}

// ============================================================================
// Public API Export
// Expose the core functions to the global `window` object for consumer scripts
// ============================================================================
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.showPrompt = showPrompt;
window.createModal = createModal;
