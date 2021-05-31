//DecimalInput.js
"use strict";

class DecimalInput {
  constructor(className, initialValue, id, existingInputElem = undefined, validator = undefined, shouldPrettifyNumber = true) {
    if (existingInputElem) {
      //use existing input
      this.input = existingInputElem;
    } else {
      //create input
      this.input = document.createElement('input');
      this.input.id = `${className}${id}`;
    }
    this.input.className = `${className ? className : ''} decimal-input`;

    this.timerID = undefined;
    this.prevInputValue = '';
    this.validator = validator || regexValidator.isValidDecimalNumString;
    this.shouldPrettifyNumber = shouldPrettifyNumber;

    this.input.maxLength = this.validator === 'montant' ? 11 : 16; // -234 678.01
    this.input.spellcheck = false;
    this.input.autocomplete = 'off';
    this.input.value = initialValue;

    //attach events handlers
    this.registerEventListeners();

    return this.input;
  }

  registerEventListeners() {
    this.input.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Escape' && this.input.value) {
        //select all with space or escape
        this.input.setSelectionRange(0, this.input.value.length, 'forward');
        e.preventDefault();
        e.stopPropagation();
      }
    });
    this.input.addEventListener('beforeinput', () => {
      this.prevInputValue = this.input.value;
    });
    this.input.addEventListener('input', (e) => {
      //replace any commas before validating input
      if (this.input.value && this.input.value.includes(',')) {
        this.input.value = this.input.value.replace(',', '.');
      }
      //validate input
      if (e.data && !regexValidator.isValidDecimalNumString(this.input.value)) {
        this.input.value = this.prevInputValue;
      }
    });
    this.input.addEventListener('change', this.setValueFormat.bind(this));
    this.input.addEventListener('blur', this.setValueFormat.bind(this));
  }

  setValueFormat() {
    clearTimeout(this.timerID); //reset debounce timer
    this.timerID = setTimeout(() => {
      const cleanInput = Number(format.withoutSpaces(this.input.value));

      const isValid = this.validator === 'montant'
        ? !isNaN(cleanInput) && cleanInput !== 0.00
        : !isNaN(cleanInput);

      const montant = isValid ? (this.shouldPrettifyNumber ? format.prettyNumber(cleanInput) : cleanInput) : '';
      if (this.input.value !== montant) {
        // set input value with new format 10000.9 --> 10 000.90
        this.input.value = montant;
      }
    }, 30);
  }
}

const regexValidator = {
  isValidDecimalNumString: (str) => /^-?\d{0,6}(\.\d{0,2})?$/.test(format.withoutSpaces(str)),
};

const format = {
  withoutSpaces: str => str.replace(/\s+/g, ''),
  roundedNum: (num, dec = 2) => (Math.round((num + Number.EPSILON) * 100) / 100).toFixed(dec),
  prettyNumber: (num) => new Intl.NumberFormat('fr-CA', {minimumFractionDigits: 2}).format(format.roundedNum(num)).replace(',', '.'),
};
