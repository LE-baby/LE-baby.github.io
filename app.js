const packageList = document.querySelector('#package-list');
const packageCount = document.querySelector('#package-count');
const refreshButton = document.querySelector('#refresh-button');
const copyButton = document.querySelector('#copy-button');

function parsePackages(text) {
  if (!text.trim()) return [];
  return text.trim().split(/\n\s*\n/).map((stanza) => {
    const fields = {};
    let current = '';
    for (const line of stanza.split('\n')) {
      if (/^\s/.test(line) && current) {
        fields[current] += ` ${line.trim()}`;
        continue;
      }
      const separator = line.indexOf(':');
      if (separator < 1) continue;
      current = line.slice(0, separator);
      fields[current] = line.slice(separator + 1).trim();
    }
    return fields;
  });
}

function renderPackages(packages) {
  packageCount.textContent = String(packages.length);
  packageList.replaceChildren();

  if (!packages.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = '暂未发布软件包。';
    packageList.append(empty);
    return;
  }

  for (const pkg of packages) {
    const row = document.createElement('article');
    row.className = 'package-row';

    const content = document.createElement('div');
    const name = document.createElement('h3');
    const description = document.createElement('p');
    const version = document.createElement('span');

    name.className = 'package-name';
    description.className = 'package-description';
    version.className = 'package-version';
    name.textContent = pkg.Name || pkg.Package || '未命名软件包';
    description.textContent = pkg.Description || pkg.Package || '';
    version.textContent = pkg.Version || '';

    content.append(name, description);
    row.append(content, version);
    packageList.append(row);
  }
}

async function loadPackages() {
  refreshButton.classList.add('spinning');
  try {
    const response = await fetch(`Packages?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    renderPackages(parsePackages(await response.text()));
  } catch (error) {
    packageCount.textContent = '不可用';
    packageList.innerHTML = '<p class="empty">软件包索引暂时无法读取。</p>';
  } finally {
    refreshButton.classList.remove('spinning');
  }
}

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(copyButton.dataset.url);
    copyButton.querySelector('span').textContent = '已复制';
    setTimeout(() => { copyButton.querySelector('span').textContent = '复制源地址'; }, 1600);
  } catch {
    window.prompt('复制源地址', copyButton.dataset.url);
  }
});

refreshButton.addEventListener('click', loadPackages);
window.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) window.lucide.createIcons();
  loadPackages();
});
