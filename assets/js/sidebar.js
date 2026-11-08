// Mobile nav: the hamburger opens the sidebar, tapping the mask closes it.
var container = document.querySelector('.theme-container');
document.querySelector('.sidebar-button').addEventListener('click', function () {
  container.classList.toggle('sidebar-open');
});
document.querySelector('.sidebar-mask').addEventListener('click', function () {
  container.classList.remove('sidebar-open');
});
