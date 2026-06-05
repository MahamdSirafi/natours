/* eslint-disable */
import { cuteToast } from './cute/cute-alert';

const form = document.getElementById('form-add-guide');
const table = document.getElementById('guides-table');

async function loadGuides() {
  try {
    const res = await fetch('/api/v1/users/guides');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
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
                    <option value="guide" ${g.role === 'guide' ? 'selected' : ''}>Guide</option>
                    <option value="lead-guide" ${g.role === 'lead-guide' ? 'selected' : ''}>Lead Guide</option>
                  </select>
                </td>
                <td style="padding:1rem;text-align:center;">
                  <button class="btn btn--small btn--green btn-save-guide" data-id="${g._id}" style="display:none;">Save</button>
                  <button class="btn btn--small btn--black btn-delete-guide" data-id="${g._id}">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    table.querySelectorAll('.edit-role').forEach((sel) => {
      sel.addEventListener('change', () => {
        const tr = sel.closest('tr');
        tr.querySelector('.btn-save-guide').style.display = 'inline-block';
      });
    });

    table.querySelectorAll('.btn-save-guide').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const tr = btn.closest('tr');
        const id = btn.dataset.id;
        const role = tr.querySelector('.edit-role').value;
        try {
          const res = await fetch(`/api/v1/users/guides/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Update failed');
          }
          btn.style.display = 'none';
          cuteToast({ type: 'success', title: 'Updated', message: 'Guide role updated', timer: 1500 });
        } catch (err) {
          cuteToast({ type: 'error', title: 'Error', message: err.message, timer: 2500 });
        }
      });
    });

    table.querySelectorAll('.btn-delete-guide').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this guide permanently?')) return;
        const tr = btn.closest('tr');
        const id = btn.dataset.id;
        try {
          const res = await fetch(`/api/v1/users/guides/${id}`, { method: 'DELETE' });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Delete failed');
          }
          tr.remove();
          cuteToast({ type: 'success', title: 'Deleted', message: 'Guide removed', timer: 1500 });
        } catch (err) {
          cuteToast({ type: 'error', title: 'Error', message: err.message, timer: 2500 });
        }
      });
    });
  } catch (err) {
    table.innerHTML = `<p class="locations-empty">Error loading guides: ${err.message}</p>`;
  }
}

if (form) {
  loadGuides();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = {
      name: data.get('name'),
      email: data.get('email'),
      password: data.get('password'),
      passwordConfirm: data.get('passwordConfirm'),
      role: data.get('role'),
    };
    try {
      const res = await fetch('/api/v1/users/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to create guide');
      cuteToast({ type: 'success', title: 'Success', message: 'Guide added successfully', timer: 1500 });
      form.reset();
      loadGuides();
    } catch (err) {
      cuteToast({ type: 'error', title: 'Error', message: err.message, timer: 2500 });
    }
  });
}
