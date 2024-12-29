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

const menu = document.querySelectorAll('.menu');
const btnToggleMenu = document.querySelectorAll('.btn_menu');

btnToggleMenu.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        menu.forEach((div, idx) => {
            if(index === idx){
                div.classList.toggle('active');
            }
        })
    })
})

const oriPrice = document.querySelector('#original_price');
const disPrice = document.querySelector('#discount_price');
const seletedSale = document.querySelector("#sale");
const priceHidden = document.querySelector('#price_hidden');
let discount = 0;

if (oriPrice && disPrice) {
    const originalValue = parseFloat(oriPrice.value);
    if (!isNaN(originalValue)) {
        disPrice.value = originalValue; 
        priceHidden.value = disPrice.value; 
    }
}

if (seletedSale) {
    seletedSale.addEventListener('change', (event) => {
        const value = event.target.value;
        discount = parseFloat(value); 
        if (oriPrice) {
            const originalValue = parseFloat(oriPrice.value);
            if (!isNaN(originalValue)) {
                const discountedPrice = originalValue * (100 - discount) / 100;
                disPrice.value = Math.trunc(discountedPrice);
                priceHidden.value = disPrice.value; 
            }
        }
    });
}

if (oriPrice) {
    oriPrice.addEventListener('input', (event) => {
        const originalValue = parseFloat(event.target.value);
        if (!isNaN(originalValue)) {
            if (discount > 0) {
                const discountedPrice = originalValue * (100 - discount) / 100;
                disPrice.value = Math.trunc(discountedPrice);
            } else {
                disPrice.value = originalValue; 
            }
            priceHidden.value = disPrice.value; 
        } else {
            disPrice.value = '';
            priceHidden.value = ''; 
        }
    });
}





// const btnAddImage = document.querySelector('.btn_add_image');

// btnAddImage.addEventListener('click', () => {
//     const inputFile = document.getElementById("inputFile");
//     inputFile.click();

//     inputFile.addEventListener('change', () => {
//         const file = inputFile.files[0];
//         if (file) {
//             const validTypes = ["image/jpeg", "image/png"];
//             if (validTypes.includes(file.type)) {
//                 renderImage(URL.createObjectURL(file));
//                 inputFile.value = ""; 
//             } else {
//                 alert("Vui lòng chọn file ảnh hợp lệ (.jpg, .jpeg, .png)!");
//                 inputFile.value = "";
//             }
//         }
//     })
// })
// function renderImage(src){
//     const wrapper = document.querySelector('.wrapper_product');
//     const html = `<div class="frame_image image">
//                     <img src="${src}">
//                     <div class="btn btn-danger btn-me">
//                         Remove
//                     </div>
//                   </div>`;
//     wrapper.insertAdjacentHTML('beforeend', html);

//     const frame = document.querySelectorAll('.image');
//     frame.forEach(fr => {
//         const btnRemove = fr.querySelector('.btn-danger');
//         btnRemove.onclick = () => {
//             btnRemove.closest('.frame_image').remove();
//         }
//     })
// }