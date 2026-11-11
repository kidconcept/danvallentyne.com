const swatches = document.querySelectorAll('.blue-swatch');
const preview = document.querySelector('#blue-preview');

swatches.forEach((swatch) => {
  swatch.addEventListener('click', () => {
    swatches.forEach((button) => {
      button.setAttribute('aria-pressed', String(button === swatch));
    });
    preview.style.setProperty('--preview-color', swatch.dataset.color);
    document.querySelector('#selected-number').textContent = `Swatch ${swatch.dataset.number}`;
    document.querySelector('#selected-hex').textContent = swatch.dataset.color;
  });
});
