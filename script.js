document.addEventListener("DOMContentLoaded", function () {
  const loginScreen = document.getElementById("login-screen");
  const customerListScreen = document.getElementById("customer-list-screen");
  const customerFormScreen = document.getElementById("customer-form-screen");

  const loginBtn = document.getElementById("login-btn");
  const form = document.getElementById("form-data");
  const customerTable = document.getElementById("customer-table");
  const customerForm = document.getElementById("customer-form");
  const addCustomerButton = document.getElementById("add-customer-btn");
  

  let bearerToken = null;
  //Helper function to make API calls
  async function makeApiCall(path, method, data = {}) {
    const headers = new Headers();
    if (bearerToken) {
      headers.append("Authorization", `Bearer ${bearerToken}`);
    }

    const options = {
      method,
      headers,
    };

    if (method === "POST" && Object.keys(data).length!==0) {
      options.body = JSON.stringify(data);
    }
    const response = await fetch(path, options);
    const jsonData = await response.json();

    if (response.ok) {
      return jsonData;
    } else {
      throw new Error(jsonData.message || "Something went wrong.");
    }
  }

  //Login Form
  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const loginId = formData.get("login");
    const password = formData.get("pass");

    try {
      const data = {
        login_id: loginId,
        password: password,
      };
      const response = await makeApiCall(
        "https://qa2.sunbasedata.com/sunbase/portal/api/assignment_auth.jsp",
        "POST",
        data
      );

      //Set the bearer token for subsequent API calls
      bearerToken = response.access_token;
      console.log(bearerToken);
      //Hide login screen and show customer list screen
      loginScreen.style.display = "none";
      customerListScreen.style.display = "block";

      //Fetch and display customer list
      const customers = await makeApiCall(
        "https://qa2.sunbasedata.com/sunbase/portal/api/assignment.jsp?cmd=get_customer_list",
        "GET"
      );
      console.log(customers.length);
      displayCustomerList(customers);
    } catch (error) {
      alert("Login failed. Please check your credentials.");
      console.error(error);
    }
  });

  //Display customer list
  function displayCustomerList(customers) {
    let html =
      '<tr><th>First Name</th><th>Last Name</th><th>Address</th><th>City</th><th>State</th><th>Email</th><th>Phone</th><th>Actions</th></tr>';

    customers.forEach((customer) => {
      html += `<tr>
      <td><span class="editable" data-field="first_name" contenteditable="false">${customer.first_name}</span></td>
      <td><span class="editable" data-field="last_name" contenteditable="false">${customer.last_name}</span></td>
      <td><span class="editable" data-field="address" contenteditable="false">${customer.address}</span></td>
      <td><span class="editable" data-field="city" contenteditable="false">${customer.city}</span></td>
      <td><span class="editable" data-field="state" contenteditable="false">${customer.state}</span></td>
      <td><span class="editable" data-field="email" contenteditable="false">${customer.email}</span></td>
      <td><span class="editable" data-field="phone" contenteditable="false">${customer.phone}</span></td>
      <td>
        <button class="edit-btn" data-uuid="${customer.uuid}">Edit</button>
        <button class="save-btn" style="display: none;">Save</button>
        <button class="delete-btn" data-uuid="${customer.uuid}">Delete</button>
      </td>
          </tr>`;
    });

    customerTable.innerHTML = html;
  }

  //Add customer button click event
  addCustomerButton.addEventListener("click", function () {
    //Clear the form fields
    customerForm.reset();

    //Show customer form screen and hide the list screen
    customerListScreen.style.display = "none";
    customerFormScreen.style.display = "block";
  });

  //Function to enable editing for a row
  function enableEditRow(row) {
    const editableFields = row.querySelectorAll(".editable");
    editableFields.forEach((field) => {
      field.contentEditable = true;
    });

    const editBtn = row.querySelector(".edit-btn");
    const saveBtn = row.querySelector(".save-btn");
    editBtn.style.display = "none";
    saveBtn.style.display = "inline";
  }

  //Function to disable editing for a row
  function disableEditRow(row) {
    const editableFields = row.querySelectorAll(".editable");
    editableFields.forEach((field) => {
      const text = field.innerText;
      field.innerHTML = text;
      field.contentEditable = false;
    });

    const editBtn = row.querySelector(".edit-btn");
    const saveBtn = row.querySelector(".save-btn");
    editBtn.style.display = "inline-block";
    saveBtn.style.display = "none";
  }

  
  
  //Edit and Delete button click events for customer list
  customerTable.addEventListener("click", async function (e) {
    if (e.target.classList.contains("edit-btn")) {
      const row = e.target.closest("tr");
      enableEditRow(row);
    } else if (e.target.classList.contains("save-btn")) {
      const row = e.target.closest("tr");
      console.log(row);
    //   const uuid = row.querySelector(".delete-btn").getAttribute("data-uuid");
    const uuid = row.querySelector(".edit-btn").getAttribute("data-uuid");
      const editableFields = row.querySelectorAll(".editable");
      const updatedCustomer = {};

      editableFields.forEach((field) => {
        const fieldName = field.getAttribute("data-field");
        const value = field.innerText;
        updatedCustomer[fieldName] = value;
      });
      //console.log(updatedCustomer);
      
      try {
        console.log("hello",uuid);
        const response = await fetch(
          `https://qa2.sunbasedata.com/sunbase/portal/api/assignment.jsp?cmd=update&uuid=${uuid}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${bearerToken}` },
            body: JSON.stringify(updatedCustomer),
          }
        );
        if(response.status===200){
            console.log("Customer Information Updated Successfully!");
        }
        const customers = await makeApiCall(
          "https://qa2.sunbasedata.com/sunbase/portal/api/assignment.jsp?cmd=get_customer_list",
          "GET"
        );
        
        displayCustomerList(customers);
      } catch (err) {
        alert("Failed to update the customer");
        console.error(err);
      } finally {
        disableEditRow(row);
      }
    } else if (e.target.classList.contains("delete-btn")) {
      const uuid = e.target.getAttribute("data-uuid");
      // Delete customer and refresh the customer list
      try {
        const response = await fetch(
          `https://qa2.sunbasedata.com/sunbase/portal/api/assignment.jsp?cmd=delete&uuid=${uuid}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${bearerToken}` },
          }
        );
        if(response.status===200){
            console.log("Customer Deleted Successfully!")
        }
        const customers = await makeApiCall(
          "https://qa2.sunbasedata.com/sunbase/portal/api/assignment.jsp?cmd=get_customer_list",
          "GET"
        );
        displayCustomerList(customers);
        console.log(customers.length);
      } catch (error) {
        alert("Failed to delete customer. Please try again.");
        console.error(error);
      }
    }
  });

  //Add new Customer
  customerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    //Get the customer data from the form
    const formData = new FormData(customerForm);
    const customerData = {
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      street: formData.get("street"),
      address: formData.get("address"),
      city: formData.get("city"),
      state: formData.get("state"),
      email: formData.get("email"),
      phone: formData.get("phone"),
    };
    try {
      // Make API call to create a new customer

      const response = await fetch(
        "https://qa2.sunbasedata.com/sunbase/portal/api/assignment.jsp?cmd=create",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${bearerToken}` },
          body: JSON.stringify(customerData),
        }
      );

      //Refresh the customer list
      const customers = await makeApiCall(
        "https://qa2.sunbasedata.com/sunbase/portal/api/assignment.jsp?cmd=get_customer_list",
        "GET"
      );
      console.log(customers.length);
      displayCustomerList(customers);

      // Clear the form fields
      customerForm.reset();

      // Show customer list screen and hide the form screen
      customerListScreen.style.display = "block";
      customerFormScreen.style.display = "none";
    } catch (error) {
      alert("Failed to add customer. Please check your input.");
      console.error(error);
    }
  });
});
