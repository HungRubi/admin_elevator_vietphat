const btnDrop = document.querySelector('.btn_drop_down');
const divDrop = document.querySelector('.drop_down');

btnDrop.addEventListener('click', () => {
    divDrop.classList.toggle('click');
    const icon = btnDrop.querySelector('.icon');
    if (divDrop.classList.contains("click")) {
        icon.classList.add("bi-caret-up-fill");
        icon.classList.remove("bi-caret-down-fill");
    } else {
        icon.classList.remove("bi-caret-up-fill");
        icon.classList.add("bi-caret-down-fill");
    }
})

const btnCollap = document.querySelector('.btn-collap');
const navBar = document.querySelector('.nav_bar');
const main = document.querySelector('.main_page');
const btnUnCollap = document.querySelector('.menu_bar_collap');

btnCollap.addEventListener('click', () => {
    navBar.classList.toggle('collap');
    main.classList.toggle('collap');
    btnUnCollap.classList.toggle('collap');
})

btnUnCollap.addEventListener('click', () => {
    navBar.classList.remove('collap');
    main.classList.remove('collap');
    btnUnCollap.classList.remove('collap');
})