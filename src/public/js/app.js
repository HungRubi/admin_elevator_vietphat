document.addEventListener("DOMContentLoaded", () => {
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

    const itemsPage = 10;
    let pageCurrent = 1;

    async function fetchProduct(page, itemsPage) {
        try{
            const response = await fetch(`/products/api/getallproducts/?page=${page}&limit=${itemsPage}`);
            if(!response.ok){
                throw new Error('Không thể lấy dữ liệu từ server');
            }
            const data = await response.json();
            return data;
        }
        catch(error){
            console.log(error);
        }
    }

    async function displayProduct(page){
        const {product, totalItem} = await fetchProduct(page, itemsPage);
        const tbody = document.querySelector('#table_body'); 
        tbody.innerHTML = '';
        product.forEach(product => {
            const row = 
                `<tr class="align-middle">
                    <td class="column_checkbox"><input type="checkbox" name="" id=""></th>
                    <td class="col_image text-center">
                        <div class="wrapper_img_product is-center">
                            <a href="#" class="is-center" style="width:100%;">
                                <img src="${product.thumbnail_main}" alt="">
                            </a>
                        </div>
                    </td>
                    <td style="color: rgb(56, 116, 255);" class="col_product"><span>${product.name}</span></td>
                    <td class="col_custumer col-1">${product.price}</td>
                    <td class="col_status col-1" style="padding-left:40px">${product.stock}</td>
                    <td class="col_star col-1">${product.unit}</td>
                    <td class="col_review col-4"><p>${product.description}</p></td>
                    <td class="col_time">
                        <p>${product.formatedDate}</p>
                        <div class="layout">
                            <div class="circle">
                                <a href="/products/${product._id}/edit">
                                    <i class="bi bi-pencil-fill"></i>
                                </a>
                            </div>
                            <div class="circle">
                                <a href="/products/${product._id}/deleted" data-bs-toggle="modal" data-id="${product._id}" data-bs-target="#delete-product-model">
                                    <i class="bi bi-trash"></i>
                                </a>
                            </div>
                            <div class="circle"><i class="bi bi-three-dots"></i></div>
                        </div>
                    </td>
                </tr>`;
            tbody.innerHTML += row;
        })
        displayPagination(totalItem, itemsPage);
    }

    function displayPagination(totalItem, itemsPage) {
        const pageBar = document.querySelector('.page_bar');
        const totalPage = Math.ceil(totalItem / itemsPage);

        pageBar.innerHTML = `<button class="next previous"> <i class="bi bi-chevron-double-left"></i></button>
                    <button class="next previous"> <i class="bi bi-chevron-left"></i> Previous</button>`;
        for(let i = 1; i <= totalPage; i++){
            const button = document.createElement("button");
            button.className = `number_page ${i === pageCurrent ? "active" : ""}`;
            button.textContent = i;
            button.addEventListener("click", async () => {
                pageCurrent = i;
                const { product, totalItem } = await fetchProduct(pageCurrent, itemsPage);
                displayProduct(pageCurrent);
                displayPagination(totalItem, itemsPage); 
            });
            pageBar.appendChild(button);
        }
        const nextButton = document.createElement("button");
        nextButton.className = "next";
        nextButton.innerHTML = `Next <i class="bi bi-chevron-right"></i>`;
        nextButton.addEventListener("click", () => {
            pageCurrent = Math.min(pageCurrent + 1, totalPage); // Điều chỉnh pageCurrent
            const { product, totalItem } = fetchProduct(pageCurrent, itemsPage);
            displayProduct(pageCurrent);
            displayPagination(totalItem, itemsPage);
        });
        pageBar.appendChild(nextButton); // Thêm nút next vào pageBar

        const nextAllButton = document.createElement("button");
        nextAllButton.className = "next_all";
        nextAllButton.innerHTML = `<i class="bi bi-chevron-double-right"></i>`;
        pageBar.appendChild(nextAllButton); // Thêm nút next_all vào pageBar

        const currentButton = document.createElement("button");
        currentButton.className = "current";
        currentButton.textContent = `Page ${pageCurrent} / ${totalPage}`;
        pageBar.appendChild(currentButton); // Thêm nút current vào pageBar
        const btnPrevious = document.querySelectorAll('.previous');
        if(pageCurrent !== 1){
            btnPrevious.forEach(btn => {
                btn.style.display = 'block';
                btn.addEventListener('click', () => {
                    pageCurrent = Math.min(pageCurrent - 1, totalPage); // Điều chỉnh pageCurrent
                    const { product, totalItem } = fetchProduct(pageCurrent, itemsPage);
                    displayProduct(pageCurrent);
                    displayPagination(totalItem, itemsPage);
                })
            })
        }else{
            btnPrevious.forEach(btn => {
                btn.style.display = 'none';
            })
        }
    }
    displayProduct(pageCurrent);

    function tabUi(){
        const currentPath = window.location.pathname;
        if(currentPath === '/'){
            document.querySelector('.tab-1').classList.add('active');
            document.querySelector('.tab-2').classList.remove('active');
            document.querySelector('.tab-3').classList.remove('active');
            document.querySelector('.tab-4').classList.remove('active');
            document.querySelector('.tab-5').classList.remove('active');
            document.querySelector('.tab-6').classList.remove('active');
        }else if(currentPath.startsWith('/orders')){
            document.querySelector('.tab-1').classList.remove('active');
            document.querySelector('.tab-2').classList.add('active');
            document.querySelector('.tab-3').classList.remove('active');
            document.querySelector('.tab-4').classList.remove('active');
            document.querySelector('.tab-5').classList.remove('active');
            document.querySelector('.tab-6').classList.remove('active');
        }else if(currentPath.startsWith('/employee')){
            document.querySelector('.tab-1').classList.remove('active');
            document.querySelector('.tab-2').classList.remove('active');
            document.querySelector('.tab-3').classList.add('active');
            document.querySelector('.tab-4').classList.remove('active');
            document.querySelector('.tab-5').classList.remove('active');
            document.querySelector('.tab-6').classList.remove('active');
        }else if(currentPath.startsWith('/custumers')){
            document.querySelector('.tab-1').classList.remove('active');
            document.querySelector('.tab-2').classList.remove('active');
            document.querySelector('.tab-3').classList.remove('active');
            document.querySelector('.tab-4').classList.add('active');
            document.querySelector('.tab-5').classList.remove('active');
            document.querySelector('.tab-6').classList.remove('active');
        }else if(currentPath.startsWith('/products')){
            document.querySelector('.tab-1').classList.remove('active');
            document.querySelector('.tab-2').classList.remove('active');
            document.querySelector('.tab-3').classList.remove('active');
            document.querySelector('.tab-4').classList.remove('active');
            document.querySelector('.tab-5').classList.add('active');
            document.querySelector('.tab-6').classList.remove('active');
        }else if(currentPath.startsWith('/articles')){
            document.querySelector('.tab-1').classList.remove('active');
            document.querySelector('.tab-2').classList.remove('active');
            document.querySelector('.tab-3').classList.remove('active');
            document.querySelector('.tab-4').classList.remove('active');
            document.querySelector('.tab-5').classList.remove('active');
            document.querySelector('.tab-6').classList.add('active');
        }
    }
    tabUi();

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
})

