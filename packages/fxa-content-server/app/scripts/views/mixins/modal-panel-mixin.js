/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Convert a view into a modal panel. A `modal-cancel` event
 * will be triggered if the user clicks on the background area.
 *
 * Any navigation will cause the panel to close.
 */

import $ from 'jquery';

export default {
  isModal: true,

  notifications: {
    navigate: 'closePanel',
    'navigate-back': 'closePanel',
  },

  /**
   * Open the panel.
   */
  openPanel() {
    this.$el.modal({
      clickClose: false, // we take care of closing on the background ourselves.
      escapeClose: false, // we take care of closing on the escape key ourselves.
      opacity: 0.75,
      showClose: false,
      zIndex: 999,
    });

    this.$el.on($.modal.AFTER_CLOSE, () => this.onAfterClose());

    this._boundBlockerClick = this.onBlockerClick.bind(this);
    $('.blocker').on('click', this._boundBlockerClick);

    /**
     * Trap keyboard focus when modal opens.
     */
    const modal = this.$el[0];
    modal.setAttribute('tabindex', '1');

    const focusableElementsList = 'a[href], button';
    let focusableElements = modal.querySelectorAll(focusableElementsList);
    focusableElements = Array.prototype.slice.call(focusableElements);

    this._tabListener = this.tabClick.bind(null, focusableElements);
    // this must be attached to a container of settings content and the modal
    document.addEventListener('keydown', this._tabListener);
  },

  tabClick(focusableElements, event) {
    function getNextSelectable(element = focusableElements[0]) {
      const nextIndex = focusableElements.indexOf(element) + 1;
      // return first element if the next element doesn't exist
      return focusableElements[nextIndex]
        ? focusableElements[nextIndex]
        : focusableElements[0];
    }

    function getPreviousSelectable(
      element = focusableElements[focusableElements.length - 1]
    ) {
      const previousIndex = focusableElements.indexOf(element) - 1;
      // return last element if the previous element doesn't exist
      return focusableElements[previousIndex]
        ? focusableElements[previousIndex]
        : focusableElements[focusableElements.length - 1];
    }

    //avoid IME composition keydown events
    //ref: https://developer.mozilla.org/docs/Web/Events/keydown#Notes
    if (event.isComposing || event.keyCode === 229) return;
    if (event.keyCode === 9) {
      event.preventDefault();
      if (event.shiftKey) {
        getPreviousSelectable(document.activeElement).focus();
      } else {
        getNextSelectable(document.activeElement).focus();
      }
    }
  },

  /**
   * Close the panel.
   */
  closePanel() {
    if ($.modal.isActive()) {
      $.modal.close();
    }
  },

  onBlockerClick(event) {
    // We take care of closing the panel ourselves so that we can
    // trigger `modal-cancel` IFF the user clicks on the black area
    // outside of the content. Clicks on this area are often handled
    // differently to either the "cancel" or "back" buttons, and
    // listening directly on `AFTER_CLOSE` causes listeners to
    // be called on every close.
    if (event.target === event.currentTarget) {
      this.closePanel();

      /**
       * Triggered if the user clicks the black background area of the modal.
       *
       * @event modal-cancel
       */
      this.trigger('modal-cancel');
    }
  },

  onAfterClose() {
    this.destroy(true);
    this.trigger('modal-cancel');
    $('.blocker').off('click', this._boundBlockerClick);
    document.removeEventListener('keydown', this._tabListener);
  },

  /**
   * Wrap the destroy function to close the panel, if it has not
   * already been done.
   */
  destroy() {
    this.closePanel();
  },
};
