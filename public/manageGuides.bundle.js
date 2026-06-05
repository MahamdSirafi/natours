var ManageGuides = (() => {
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // public/js/cute/cute-alert.js
  var cuteToast = ({
    type,
    title,
    message,
    timer = 5e3,
    vibrate = [],
    playSound = null
  }) => {
    return new Promise((resolve) => {
      const body = document.querySelector("body");
      const scripts = document.getElementsByTagName("script");
      let src = "/js/cute";
      for (let script of scripts) {
        if (script.src.includes("cute-alert.js")) {
          src = script.src.substring(0, script.src.lastIndexOf("/"));
        }
      }
      let templateContainer = document.querySelector(".toast-container");
      if (!templateContainer) {
        body.insertAdjacentHTML(
          "afterend",
          '<div class="toast-container"></div>'
        );
        templateContainer = document.querySelector(".toast-container");
      }
      const toastId = id();
      const templateContent = `
    <div class="toast-content ${type}-bg" id="${toastId}-toast-content">
      <div>
        <div class="toast-frame">
          <div class="toast-body">
            <img class="toast-body-img" src="${src}/img/${type}.svg" />'
            <div class="toast-body-content">
              <span class="toast-title">${title}</span>
              <span class="toast-message">${message}</span>
            </div>
            <div class="toast-close" id="${toastId}-toast-close">X</div>
          </div>
        </div>
        <div class="toast-timer ${type}-timer"  style="animation: timer${timer}ms linear;>
      </div>
    </div>
    `;
      const toasts = document.querySelectorAll(".toast-content");
      if (toasts.length) {
        toasts[0].insertAdjacentHTML("beforebegin", templateContent);
      } else {
        templateContainer.innerHTML = templateContent;
      }
      const toastContent = document.getElementById(`${toastId}-toast-content`);
      if (vibrate.length > 0) {
        navigator.vibrate(vibrate);
      }
      if (playSound !== null) {
        let sound = new Audio(playSound);
        sound.play();
      }
      setTimeout(() => {
        toastContent.remove();
        resolve();
      }, timer);
      const toastClose = document.getElementById(`${toastId}-toast-close`);
      toastClose.addEventListener("click", () => {
        toastContent.remove();
        resolve();
      });
    });
  };
  var id = () => {
    return "_" + Math.random().toString(36).substr(2, 9);
  };

  // public/js/manageGuides.js
  var form = document.getElementById("form-add-guide");
  var table = document.getElementById("guides-table");
  function loadGuides() {
    return __async(this, null, function* () {
      try {
        const res = yield fetch("/api/v1/users/guides");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = yield res.json();
        const guides = json.data.data;
        if (guides.length === 0) {
          table.innerHTML = '<p class="locations-empty">No guides found</p>';
          return;
        }
        table.innerHTML = `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:1.3rem;">
          <thead>
            <tr style="background:#f7f7f7;">
              <th style="padding:1rem;text-align:left;">Name</th>
              <th style="padding:1rem;text-align:left;">Email</th>
              <th style="padding:1rem;text-align:left;">Role</th>
              <th style="padding:1rem;text-align:center;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${guides.map((g) => `
              <tr style="border-bottom:1px solid #eee;" data-id="${g._id}">
                <td style="padding:1rem;">${g.name}</td>
                <td style="padding:1rem;">${g.email}</td>
                <td style="padding:1rem;">
                  <select class="edit-role form__input" style="padding:0.3rem;font-size:1.2rem;">
                    <option value="guide" ${g.role === "guide" ? "selected" : ""}>Guide</option>
                    <option value="lead-guide" ${g.role === "lead-guide" ? "selected" : ""}>Lead Guide</option>
                  </select>
                </td>
                <td style="padding:1rem;text-align:center;">
                  <button class="btn btn--small btn--green btn-save-guide" data-id="${g._id}" style="display:none;">Save</button>
                  <button class="btn btn--small btn--black btn-delete-guide" data-id="${g._id}">Delete</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
        table.querySelectorAll(".edit-role").forEach((sel) => {
          sel.addEventListener("change", () => {
            const tr = sel.closest("tr");
            tr.querySelector(".btn-save-guide").style.display = "inline-block";
          });
        });
        table.querySelectorAll(".btn-save-guide").forEach((btn) => {
          btn.addEventListener("click", () => __async(null, null, function* () {
            const tr = btn.closest("tr");
            const id2 = btn.dataset.id;
            const role = tr.querySelector(".edit-role").value;
            try {
              const res2 = yield fetch(`/api/v1/users/guides/${id2}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role })
              });
              if (!res2.ok) {
                const err = yield res2.json();
                throw new Error(err.message || "Update failed");
              }
              btn.style.display = "none";
              cuteToast({ type: "success", title: "Updated", message: "Guide role updated", timer: 1500 });
            } catch (err) {
              cuteToast({ type: "error", title: "Error", message: err.message, timer: 2500 });
            }
          }));
        });
        table.querySelectorAll(".btn-delete-guide").forEach((btn) => {
          btn.addEventListener("click", () => __async(null, null, function* () {
            if (!confirm("Delete this guide permanently?")) return;
            const tr = btn.closest("tr");
            const id2 = btn.dataset.id;
            try {
              const res2 = yield fetch(`/api/v1/users/guides/${id2}`, { method: "DELETE" });
              if (!res2.ok) {
                const err = yield res2.json();
                throw new Error(err.message || "Delete failed");
              }
              tr.remove();
              cuteToast({ type: "success", title: "Deleted", message: "Guide removed", timer: 1500 });
            } catch (err) {
              cuteToast({ type: "error", title: "Error", message: err.message, timer: 2500 });
            }
          }));
        });
      } catch (err) {
        table.innerHTML = `<p class="locations-empty">Error loading guides: ${err.message}</p>`;
      }
    });
  }
  if (form) {
    loadGuides();
    form.addEventListener("submit", (e) => __async(null, null, function* () {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      const body = {
        name: data.get("name"),
        email: data.get("email"),
        password: data.get("password"),
        passwordConfirm: data.get("passwordConfirm"),
        role: data.get("role")
      };
      try {
        const res = yield fetch("/api/v1/users/guides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const json = yield res.json();
        if (!res.ok) throw new Error(json.message || "Failed to create guide");
        cuteToast({ type: "success", title: "Success", message: "Guide added successfully", timer: 1500 });
        form.reset();
        loadGuides();
      } catch (err) {
        cuteToast({ type: "error", title: "Error", message: err.message, timer: 2500 });
      }
    }));
  }
})();
