function Login(props) {
  async function authenticate() {
    fetch(process.env.PUBLIC_URL + "/login", {
      credentials: "include",
      method: "post",
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: document.getElementById("username").value, password: document.getElementById("password").value }),
    }).then((response) => {
      if (response.status === 200) props.handleClick("home");
      if (response.status === 401) document.getElementById("error").innerText = "Incorrect credentials";
    });
  }

  async function register() {
    if (document.getElementById("password1").value !== document.getElementById("password2").value) {
      document.getElementById("error").innerText = "Password don't match";
    } else if (document.getElementById("password1").value.length < 6) {
      document.getElementById("error").innerText = "Password too short";
    } else {
      fetch(process.env.PUBLIC_URL + "/register", {
        credentials: "include",
        method: "post",
        cache: "no-cache",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: document.getElementById("username").value, email: document.getElementById("email").value, password: document.getElementById("password1").value }),
      }).then((response) => {
        if (response.status === 200) props.handleClick("home");
        if (response.status === 400) document.getElementById("error").innerText = "Username already exists";
        if (response.status === 401) document.getElementById("error").innerText = "Email already taken";
      });
    }
  }

  if (props.login) {
    return (
      <>
        <div className="centered_menu">
          <div id="login_form">
            <h3>Login</h3>
            <input type="text" id="username" placeholder="Username" />
            <input type="password" id="password" placeholder="Password" />
            <h6 id="error"></h6>
            <button onClick={authenticate}>Login</button>
            <h5>
              <span className="link" onClick={() => props.handleClick("register")}>
                Register
              </span>{" "}
              instead?
            </h5>
          </div>
          <button className="back" onClick={() => props.handleClick("home")}>
            Main Menu
          </button>
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className="centered_menu">
          <div id="login_form">
            <h3>Register</h3>
            <input type="text" id="username" placeholder="Username" />
            <input type="email" id="email" placeholder="Email" />
            <br />
            <input type="password" id="password1" placeholder="Password" />
            <input type="password" id="password2" placeholder="Confirm password" />
            <h6 id="error"></h6>
            <button onClick={register}>Register</button>
            <h5>
              <span className="link" onClick={() => props.handleClick("login")}>
                Login
              </span>{" "}
              instead?
            </h5>
          </div>
          <button className="back" onClick={() => props.handleClick("home")}>
            Main Menu
          </button>
        </div>
      </>
    );
  }
}

export default Login;
