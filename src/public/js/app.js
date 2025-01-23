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

    const menuToggle = document.querySelectorAll('.menu');
    const btnToggleMenu = document.querySelectorAll('.btn_menu');

    btnToggleMenu.forEach((btn, index) => {
        const menu = menuToggle[index];
        btn.addEventListener('click', (event) => {
            event.stopPropagation();
            menuToggle.forEach((m) => {
                if (m !== menu) m.classList.remove('active');
            });
            menu.classList.toggle('active');
        });
    });
    
    document.addEventListener('click', (event) => {
        menuToggle.forEach((menu) => {
            if (!menu.contains(event.target)) {
                menu.classList.remove('active');
            }
        });
    });

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

    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": false,
        "progressBar": true,
        "positionClass": "toast-bottom-right", // Vị trí: top-right, top-left, bottom-right, bottom-left
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };

    function renderCustumerTable() {
        const btnAdd = document.querySelector('.btn_add_products');
        const listSelect = document.querySelector('.list_products');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                let isExit = false;
                const selectedCustumer = listSelect.value;
                const selectedNameCustumer = listSelect.options[listSelect.selectedIndex].textContent;
                if (selectedCustumer === '--- Products ---' || selectedCustumer === '' ||selectedNameCustumer === '') {
                    toastr.warning('Vui lòng chọn sản phẩm hợp lệ!','Message');
                } else {
                    const rows = document.querySelectorAll('.table_products .tbody_products .table-row-products');
                    rows.forEach((row) => {
                        const nameProduct = row.querySelector('td:nth-child(3)').textContent.trim();
                        if (nameProduct === selectedNameCustumer.trim()) {
                            isExit = true;
                        }});
                    if (isExit) {
                        toastr.warning('Sản phẩm này đã có trong danh sách!','Message');
                    } else {
                        const thumbnail =listSelect.options[listSelect.selectedIndex].getAttribute('data-image');
                        const nameProduct =listSelect.options[listSelect.selectedIndex].getAttribute('data-name');
                        const songPrice =listSelect.options[listSelect.selectedIndex].getAttribute('data-price');
                        const tbody = document.querySelector('.tbody_products');
                        const newRow = document.createElement('tr');
                        newRow.classList.add('align-middle','table-row-products');
                        newRow.innerHTML = `
                            <td style="width:50px;"><input type="checkbox" name="" id=""></td>
                            <td class="col_image text-center col-2">
                                <div class="wrapper_img_product is-center">
                                    <a href="#" class="is-center" style="width:100%;">
                                        <img src="${thumbnail}" alt="product">
                                    </a>
                                </div>
                            </td>
                            <td class="col-5">${nameProduct}</td>
                            <td class="col-3">${songPrice}</td>
                            <td class="col-1 text-center">1</td>`;
                        tbody.appendChild(newRow);
                        toastr.success('Thêm sản phẩm thành công!','Message');
                    }
                }
            });
        }
    }
    
    (function ($) {
        "use strict";
        $('.input100').each(function(){
            $(this).on('blur', function(){
                if($(this).val().trim() != "") {
                    $(this).addClass('has-val');
                }
                else {
                    $(this).removeClass('has-val');
                }
            })    
        })
        
        var input = $('.validate-input .input100');

        $('.validate-form').on('submit',function(){
            var check = true;

            for(var i=0; i<input.length; i++) {
                if(validate(input[i]) == false){
                    showValidate(input[i]);
                    check=false;
                }
            }

            return check;
        });


        $('.validate-form .input100').each(function(){
            $(this).focus(function(){
            hideValidate(this);
            });
        });

        function validate (input) {
            if($(input).attr('type') == 'email' || $(input).attr('name') == 'email') {
                if($(input).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
                    return false;
                }
            }
            else {
                if($(input).val().trim() == ''){
                    return false;
                }
            }
        }

        function showValidate(input) {
            var thisAlert = $(input).parent();

            $(thisAlert).addClass('alert-validate');
        }

        function hideValidate(input) {
            var thisAlert = $(input).parent();

            $(thisAlert).removeClass('alert-validate');
        }
        
        var showPass = 0;
        $('.btn-show-pass').on('click', function(){
            if(showPass == 0) {
                $(this).next('input').attr('type','text');
                $(this).find('i').removeClass('zmdi-eye');
                $(this).find('i').addClass('zmdi-eye-off');
                showPass = 1;
            }
            else {
                $(this).next('input').attr('type','password');
                $(this).find('i').addClass('zmdi-eye');
                $(this).find('i').removeClass('zmdi-eye-off');
                showPass = 0;
            }
            
        });

    })(jQuery);

    
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
            renderCustumerTable();
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

