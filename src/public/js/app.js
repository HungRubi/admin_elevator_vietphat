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

    function menuClick() {
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
    }
    menuClick();
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
        let indexQuan = 0;
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
                            <td style="width:50px;"><input type="checkbox" name="items[0][productId]" value="${selectedCustumer}"></td>
                            <td class="col_image text-center col-2">
                                <div class="wrapper_img_product is-center">
                                    <a href="#" class="is-center" style="width:100%;">
                                        <img src="${thumbnail}" alt="product">
                                    </a>
                                </div>
                            </td>
                            <td class="col-5">${nameProduct}</td>
                            <td class="col-3">${songPrice}</td>
                            <td class="col-1 text-center">
                                <div>
                                    <input type="number" class="input_quantity" name="items[${indexQuan}][quantity]" value="1" min="1">
                                </div>
                            </td>`;
                            
                        tbody.appendChild(newRow);
                        indexQuan ++;
                        toastr.success('Thêm sản phẩm thành công!','Message');
                    }
                }
            });
        }
    }
    
    async function renderEmployee(){
        const response = await fetch('http://localhost:4000/login/api/employee/infor');
        const employee = await response.json();
        const html = 
            `<img src="${employee.employee.avatar}" alt="" style="border-radius: 50%;" class="btn_menu">
            <div class="menu">
                <div class="infor_user is-center">
                    <div class="circle">
                        <img src="${employee.employee.avatar}" alt="" style="border-radius: 50%;">
                    </div>
                </div>
                <div class="infor_user is-center" style="padding-bottom: 15px; padding-top: 10px">
                    <h3 class="title">${employee.employee.name}</h3>
                </div>
                <div class="divider"></div>
                <ul class="list_menu">
                    <li class="item_menu">
                        <a href="#" class="is-center">
                            <i class="bi bi-person"></i>
                            Profile
                        </a>
                    </li>
                    <li class="item_menu">
                        <a href="#" class="is-center">
                            <i class="bi bi-lock"></i>
                            Password
                        </a>
                    </li>
                    <li class="item_menu">
                        <a href="#" class="is-center">
                            <i class="bi bi-question-circle"></i>
                            Help
                        </a>
                    </li>
                </ul>
                <div class="divider"></div>
                <a href="/logout" class="layout is-center">
                    <div class="btn-logout is-center">
                        <i class="bi bi-arrow-bar-right"></i>
                        Logout
                    </div>
                </a>
            </div>`;
        const menuUser = document.querySelector('.menu_user');
        menuUser.innerHTML = html;
        menuClick();
    }
    function renderChart(labels, data) {
        const ctx = document.getElementById("customerChart").getContext("2d");
    
        new Chart(ctx, {
            type: "line",
            data: {
                labels: labels, // Mảng ngày
                datasets: [{
                    label: "Số lượng khách hàng",
                    data: data, // Mảng số lượng khách hàng
                    borderColor: "blue",
                    backgroundColor: "rgba(0, 0, 255, 0.2)",
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true }
                },
                scales: {
                    // x: {
                    //     title: { display: true, text: "Day" }
                    // },
                    // y: {
                    //     beginAtZero: true,
                    //     title: { display: true, text: "Count" }
                    // }
                }
            }
        });
    }
    async function renderChartCount() {
        const response = await fetch(`http://localhost:4000/custumers/api/count-custumer`);
        const result = await response.json();

        const labels = result.map(item => `${item._id.year}-${String(item._id.month).padStart(2, "0")}-${String(item._id.day).padStart(2, "0")}`);
        const data = result.map(item => item.count);

        renderChart(labels, data);
    }
    renderEmployee();
    function tabUi(){
        const currentPath = window.location.pathname;
        if(currentPath === '/'){
            document.querySelector('.tab-1').classList.add('active');
            document.querySelector('.tab-2').classList.remove('active');
            document.querySelector('.tab-3').classList.remove('active');
            document.querySelector('.tab-4').classList.remove('active');
            document.querySelector('.tab-5').classList.remove('active');
            document.querySelector('.tab-6').classList.remove('active');
            document.querySelector('.tab-7').classList.remove('active');
            document.querySelector('.tab-8').classList.remove('active');
            document.querySelector('.tab-9').classList.remove('active');
            document.querySelector('.tab-10').classList.remove('active');
            divDrop.classList.remove('click');
            document.querySelector('.tab-11').classList.remove('active');

            document.querySelector('.login_container').style.display = 'none';
            renderChartCount();

        }else if(currentPath.startsWith('/orders')){
            document.querySelector('.tab-1').classList.remove('active');
            document.querySelector('.tab-2').classList.add('active');
            document.querySelector('.tab-3').classList.remove('active');
            document.querySelector('.tab-4').classList.remove('active');
            document.querySelector('.tab-5').classList.remove('active');
            document.querySelector('.tab-6').classList.remove('active');
            document.querySelector('.tab-7').classList.remove('active');
            document.querySelector('.tab-8').classList.remove('active');
            document.querySelector('.tab-9').classList.remove('active');
            document.querySelector('.tab-10').classList.remove('active');
            document.querySelector('.tab-11').classList.remove('active');
            divDrop.classList.remove('click');
            document.querySelector('.login_container').style.display = 'none';

            renderCustumerTable();
        }else if(currentPath.startsWith('/users')){
            document.querySelector('.tab-1').classList.remove('active');
            document.querySelector('.tab-2').classList.remove('active');
            document.querySelector('.tab-3').classList.add('active');
            document.querySelector('.tab-4').classList.remove('active');
            document.querySelector('.tab-5').classList.remove('active');
            document.querySelector('.tab-6').classList.remove('active');
            document.querySelector('.tab-7').classList.remove('active');
            document.querySelector('.tab-8').classList.remove('active');
            document.querySelector('.tab-9').classList.remove('active');
            document.querySelector('.tab-10').classList.remove('active');
            document.querySelector('.tab-11').classList.remove('active');
            divDrop.classList.remove('click');
            document.querySelector('.login_container').style.display = 'none';

        }else if(currentPath.startsWith('/setting')){
            document.querySelector('.tab-1').classList.remove('active');
            document.querySelector('.tab-2').classList.remove('active');
            document.querySelector('.tab-3').classList.add('active');
            document.querySelector('.tab-4').classList.remove('active');
            document.querySelector('.tab-5').classList.remove('active');
            document.querySelector('.tab-6').classList.remove('active');
            document.querySelector('.tab-7').classList.remove('active');
            document.querySelector('.tab-8').classList.remove('active');
            document.querySelector('.tab-9').classList.remove('active');
            document.querySelector('.tab-10').classList.remove('active');
            document.querySelector('.tab-11').classList.remove('active');
            divDrop.classList.remove('click');
            document.querySelector('.login_container').style.display = 'none';

        }else if(currentPath.startsWith('/products')){
            document.querySelector('.tab-1').classList.remove('active');
            document.querySelector('.tab-2').classList.remove('active');
            document.querySelector('.tab-3').classList.remove('active');
            document.querySelector('.login_container').style.display = 'none';
            document.querySelector('.tab-4').classList.remove('active');
            document.querySelector('.tab-5').classList.add('active');
            document.querySelector('.tab-6').classList.remove('active');
            document.querySelector('.tab-7').classList.remove('active');
            document.querySelector('.tab-8').classList.remove('active');
            document.querySelector('.tab-9').classList.remove('active');
            document.querySelector('.tab-10').classList.remove('active');
            document.querySelector('.tab-11').classList.remove('active');
            const itemsPage = 10;
            let pageCurrent = 1;

            async function fetchProduct(page, itemsPage) {
                try{
                    const response = await fetch(`https://admin.phukienthangmay.vn/products/api/getallproducts/?page=${page}&limit=${itemsPage}`);
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
            divDrop.classList.remove('click');

        }else if(currentPath.startsWith('/articles')){
            document.querySelector('.tab-1').classList.remove('active');
            document.querySelector('.tab-2').classList.remove('active');
            document.querySelector('.tab-3').classList.remove('active');
            document.querySelector('.tab-4').classList.remove('active');
            document.querySelector('.tab-5').classList.remove('active');
            document.querySelector('.tab-6').classList.add('active');
            document.querySelector('.tab-7').classList.remove('active');
            document.querySelector('.tab-8').classList.remove('active');
            document.querySelector('.tab-9').classList.remove('active');
            document.querySelector('.tab-10').classList.remove('active');
            document.querySelector('.tab-11').classList.remove('active');
            divDrop.classList.remove('click');
            document.querySelector('.login_container').style.display = 'none';
        }else if(currentPath.startsWith('/report')){
            document.querySelector('.tab-1').classList.remove('active');
            document.querySelector('.tab-2').classList.remove('active');
            document.querySelector('.tab-3').classList.remove('active');
            document.querySelector('.tab-4').classList.remove('active');
            document.querySelector('.tab-5').classList.remove('active');
            document.querySelector('.tab-6').classList.remove('active');
            document.querySelector('.tab-7').classList.add('active');
            document.querySelector('.tab-8').classList.remove('active');
            document.querySelector('.tab-9').classList.remove('active');
            document.querySelector('.tab-10').classList.remove('active');
            document.querySelector('.tab-11').classList.remove('active');
            document.querySelector('.login_container').style.display = 'none';
            divDrop.classList.remove('click');
            
        }else if(currentPath.startsWith('/category/product')){
            document.querySelector('.tab-1').classList.remove('active');
            document.querySelector('.tab-2').classList.remove('active');
            document.querySelector('.tab-3').classList.remove('active');
            document.querySelector('.tab-4').classList.remove('active');
            document.querySelector('.login_container').style.display = 'none';
            document.querySelector('.tab-5').classList.remove('active');
            document.querySelector('.tab-6').classList.remove('active');
            document.querySelector('.tab-7').classList.remove('active');
            document.querySelector('.tab-8').classList.add('active');
            document.querySelector('.tab-9').classList.remove('active');
            document.querySelector('.tab-10').classList.remove('active');
            document.querySelector('.login_container').style.display = 'none';
            document.querySelector('.tab-11').classList.remove('active');
            divDrop.classList.add('click');

        }else if(currentPath.startsWith('/category/discount')){
            document.querySelector('.tab-1').classList.remove('active');
            document.querySelector('.tab-2').classList.remove('active');
            document.querySelector('.tab-3').classList.remove('active');
            document.querySelector('.tab-4').classList.remove('active');
            document.querySelector('.tab-5').classList.remove('active');
            document.querySelector('.tab-6').classList.remove('active');
            document.querySelector('.tab-7').classList.remove('active');
            document.querySelector('.tab-8').classList.remove('active');
            document.querySelector('.tab-9').classList.add('active');
            document.querySelector('.tab-10').classList.remove('active');
            document.querySelector('.tab-11').classList.remove('active');
            document.querySelector('.login_container').style.display = 'none';
            divDrop.classList.add('click');

        }else if(currentPath.startsWith('/category/banner')){
            document.querySelector('.tab-1').classList.remove('active');
            document.querySelector('.tab-2').classList.remove('active');
            document.querySelector('.tab-3').classList.remove('active');
            document.querySelector('.tab-4').classList.remove('active');
            document.querySelector('.tab-5').classList.remove('active');
            document.querySelector('.tab-6').classList.remove('active');
            document.querySelector('.tab-7').classList.remove('active');
            document.querySelector('.tab-8').classList.remove('active');
            document.querySelector('.tab-9').classList.remove('active');
            document.querySelector('.tab-10').classList.add('active');
            document.querySelector('.tab-11').classList.remove('active');
            document.querySelector('.login_container').style.display = 'none';
            divDrop.classList.add('click');

        }else if(currentPath.startsWith('/category/notification')){
            document.querySelector('.tab-1').classList.remove('active');
            document.querySelector('.tab-2').classList.remove('active');
            document.querySelector('.tab-3').classList.remove('active');
            document.querySelector('.tab-4').classList.remove('active');
            document.querySelector('.tab-5').classList.remove('active');
            document.querySelector('.tab-6').classList.remove('active');
            document.querySelector('.tab-7').classList.remove('active');
            document.querySelector('.tab-8').classList.remove('active');
            document.querySelector('.tab-9').classList.remove('active');
            document.querySelector('.tab-10').classList.remove('active');
            document.querySelector('.tab-11').classList.add('active');
            document.querySelector('.login_container').style.display = 'none';
            divDrop.classList.add('click');

        }
    }
    tabUi();
    
    const formLogin = document.querySelector('.form_login');
    if(formLogin){
        formLogin.addEventListener('submit', (event) => {
            console.log('Form submitted');
        })
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
})

