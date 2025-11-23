import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const placeholder = (title) => `import React from 'react';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';

const ${title} = () => {
  return (
    <div className="space-y-6">
      <Card title="${title}">
        <p className="text-gray-600">This page is under construction.</p>
      </Card>
    </div>
  );
};

export default ${title};
`;

const pages = [
  // Student pages
  { path: 'src/pages/student/Jobs.jsx', name: 'Jobs' },
  { path: 'src/pages/student/JobDetails.jsx', name: 'JobDetails' },
  { path: 'src/pages/student/Applications.jsx', name: 'Applications' },
  { path: 'src/pages/student/Contracts.jsx', name: 'Contracts' },
  { path: 'src/pages/student/Messages.jsx', name: 'Messages' },
  { path: 'src/pages/student/Notifications.jsx', name: 'Notifications' },
  { path: 'src/pages/student/Profile.jsx', name: 'Profile' },
  { path: 'src/pages/student/Reviews.jsx', name: 'Reviews' },

  // Client pages
  { path: 'src/pages/client/Dashboard.jsx', name: 'Dashboard' },
  { path: 'src/pages/client/Jobs.jsx', name: 'Jobs' },
  { path: 'src/pages/client/JobForm.jsx', name: 'JobForm' },
  { path: 'src/pages/client/Applications.jsx', name: 'Applications' },
  { path: 'src/pages/client/Contracts.jsx', name: 'Contracts' },
  { path: 'src/pages/client/Packages.jsx', name: 'Packages' },
  { path: 'src/pages/client/Messages.jsx', name: 'Messages' },
  { path: 'src/pages/client/Notifications.jsx', name: 'Notifications' },
  { path: 'src/pages/client/Profile.jsx', name: 'Profile' },
  { path: 'src/pages/client/Reviews.jsx', name: 'Reviews' },
  { path: 'src/pages/client/Transactions.jsx', name: 'Transactions' },

  // Admin pages
  { path: 'src/pages/admin/Dashboard.jsx', name: 'Dashboard' },
  { path: 'src/pages/admin/Verifications.jsx', name: 'Verifications' },
  { path: 'src/pages/admin/Users.jsx', name: 'Users' },
  { path: 'src/pages/admin/Jobs.jsx', name: 'Jobs' },
  { path: 'src/pages/admin/Contracts.jsx', name: 'Contracts' },
  { path: 'src/pages/admin/Transactions.jsx', name: 'Transactions' },
  { path: 'src/pages/admin/Reviews.jsx', name: 'Reviews' },
];

pages.forEach(page => {
  const filePath = path.join(__dirname, page.path);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, placeholder(page.name));
    console.log(`Created: ${page.path}`);
  } else {
    console.log(`Skipped (exists): ${page.path}`);
  }
});

console.log('All pages created!');
