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