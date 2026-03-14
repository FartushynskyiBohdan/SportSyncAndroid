# Project MySQL Database Access Guide for Groupmates

This guide will walk you through downloading DBeaver, setting up an SSH tunnel, and connecting to the MySQL database hosted on our Oracle Cloud VM.  

> **Note:** Replace placeholders like `<VM_PUBLIC_IP>`, `<USERNAME>`, `<PASSWORD>`, `<PRIVATE_KEY_PATH>`, and `<DATABASE_NAME>` with the actual values provided by the project lead. They should be in the .env file.

---

## 1. Download and Install DBeaver

1. Go to [DBeaver Community Edition](https://dbeaver.io/download/)  
2. Download the version for your operating system (Windows / macOS / Linux)  
3. Install DBeaver using the default options  

---

## 2. Obtain the SSH Private Key

1. The project uses **SSH tunneling** for secure access.  
2. You should receive a private key file (`.key`) from the project lead.  
3. Save the key in a secure location on your computer (e.g., `~/.ssh/project_vm.key`).  
4. On Linux/macOS, set correct permissions:

```bash
chmod 600 <PRIVATE_KEY_PATH>
```

---

## 3. Create a New DBeaver Connection

1. Open DBeaver  
2. Click **Database → New Database Connection**  
3. Select **MySQL** and click **Next**  

---

### Main Tab

| Field    | Value                       |
| -------- | --------------------------- |
| Host     | `127.0.0.1`                 |
| Port     | `3306` (or your local port) |
| Database | `<DATABASE_NAME>`           |
| Username | `<USERNAME>`                |
| Password | `<SQL_PASS_[NAME]>`         |

> **Important:** Do **not** enter the VM public IP here — the SSH tunnel handles that.

---

### SSH Tab (for tunneling)

In the upper right corner of the window, click the + SSH button and select the SSH option.

| Field                 | Value                                |
| --------------------- | ------------------------------------ |
| Host/IP               | `<VM_PUBLIC_IP>`                     |
| Port                  | 22                                   |
| User name             | `ubuntu`                             |
| Authentication method | Public Key                           |
| Private key           | `<PRIVATE_KEY_PATH>`                 |
| Passphrase            | leave empty                          |

* Set **Local Port** to `3306`
* Click **Test Connection** → it should succeed  

---

## 4. Verify Connection

1. Open **Database Navigator** in DBeaver  
2. Expand your connection  
3. You should see your database `<DATABASE_NAME>` and its tables  

---

## 5. Troubleshooting Common Issues

### SSH Connection Fails

* Make sure private key permissions are correct: `chmod 600 <PRIVATE_KEY_PATH>`  
* Confirm your laptop can reach port 22 on the VM (try `ssh -i <PRIVATE_KEY_PATH> ubuntu@<VM_PUBLIC_IP>` in terminal)  
* Ensure the VM public IP is correct  

### Database Not Visible

* Ensure your user `<USERNAME>` has privileges on `<DATABASE_NAME>`  
* If not, ask the project lead to apply:

```sql
GRANT ALL PRIVILEGES ON <DATABASE_NAME>.* TO '<USERNAME>'@'localhost';
FLUSH PRIVILEGES;
```

### Public Key Retrieval Error (MySQL 8+)

* User must be set with `mysql_native_password` plugin  
* If you see this error, contact the project lead  

### Wrong Local Port

* Ensure the port you forward in SSH tab matches the port in the main tab (usually `3306`)  

---

## 6. Alternative GUI Clients

You can also use **Beekeeper Studio** or **MySQL Workbench** with the same SSH tunnel settings:

* Host: `127.0.0.1`  
* Port: `3306` (local forwarded port)  
* Use SSH tunnel to connect to `<VM_PUBLIC_IP>` with private key  

---

## 7. Security Notes

* **Do not expose MySQL port 3306** to the public — always use SSH tunneling  
* Close your SSH sessions when not in use  
* Keep your private key secure and never share it  

---

## 8. Summary

1. Download and install DBeaver  
2. Place the SSH private key on your machine and secure it  
3. Configure a new MySQL connection using **SSH tunneling**  
4. Use your provided `<USERNAME>` and `<PASSWORD>` to access `<DATABASE_NAME>`  
5. Refresh the schema list to view tables  

> Following these steps, all groupmates should be able to securely connect to the database from their local machines without exposing MySQL to the public internet.

