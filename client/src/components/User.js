import { useState, useEffect } from "react";

function User(props) {
  const [userInfo, setUserInfo] = useState(false);

  async function logout() {
    fetch(process.env.PUBLIC_URL + "/logout", {
      credentials: "include",
      method: "post",
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
    }).then((response) => {
      if (response.status === 200) setUserInfo(false);
    });
  }

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/user", { credentials: "include" })
      .then((response) => response.json())
      .then((data) => setUserInfo(data));
  }, [props]);

  if (userInfo) {
    return (
      <>
        <div id="user_info">
          <h3 id="username"> {userInfo.username} </h3>
          <h3 id="credits">
            {userInfo.credits.toLocaleString("en-CA", {
              style: "currency",
              currency: "CAD",
            })}
          </h3>
        </div>
        <span onClick={logout}>Logout</span>
      </>
    );
  } else {
    return (
      <>
        <span onClick={() => props.handleClick("login")}>Login</span>
        <span onClick={() => props.handleClick("register")}>Register</span>
      </>
    );
  }
}

export default User;
