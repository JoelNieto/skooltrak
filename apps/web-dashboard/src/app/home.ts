import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  template: ` <div id="admin-dashboard" class="role-section layout-padding">
    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div
        class="dashboard-card bg-white rounded-xl shadow-sm p-6 border border-gray-100"
      >
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-500">Total Students</p>
            <p class="text-3xl font-bold text-gray-800 mt-1">1,842</p>
            <p class="text-xs text-green-600 mt-1 flex items-center">
              <i class="fas fa-arrow-up mr-1"></i> 5.2% from last year
            </p>
          </div>
          <div class="bg-blue-100 p-3 rounded-lg">
            <i class="fas fa-user-graduate text-blue-600 text-xl"></i>
          </div>
        </div>
      </div>

      <div
        class="dashboard-card bg-white rounded-xl shadow-sm p-6 border border-gray-100"
      >
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-500">Faculty Members</p>
            <p class="text-3xl font-bold text-gray-800 mt-1">127</p>
            <p class="text-xs text-gray-600 mt-1">Across all departments</p>
          </div>
          <div class="bg-green-100 p-3 rounded-lg">
            <i class="fas fa-chalkboard-teacher text-green-600 text-xl"></i>
          </div>
        </div>
      </div>

      <div
        class="dashboard-card bg-white rounded-xl shadow-sm p-6 border border-gray-100"
      >
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-500">Active Courses</p>
            <p class="text-3xl font-bold text-gray-800 mt-1">286</p>
            <p class="text-xs text-gray-600 mt-1">This semester</p>
          </div>
          <div class="bg-amber-100 p-3 rounded-lg">
            <i class="fas fa-book-open text-amber-600 text-xl"></i>
          </div>
        </div>
      </div>

      <div
        class="dashboard-card bg-white rounded-xl shadow-sm p-6 border border-gray-100"
      >
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-500">System Status</p>
            <p class="text-3xl font-bold text-green-600 mt-1">Online</p>
            <p class="text-xs text-gray-600 mt-1">All systems operational</p>
          </div>
          <div class="bg-green-100 p-3 rounded-lg">
            <i class="fas fa-server text-green-600 text-xl"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Recent Activity -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-list-alt text-blue-500 mr-2"></i> Recent System
          Activity
        </h3>

        <div class="space-y-4">
          <div class="flex items-start p-3 border border-gray-200 rounded-lg">
            <div class="bg-green-100 text-green-800 p-2 rounded-lg mr-4">
              <i class="fas fa-user-plus"></i>
            </div>
            <div class="flex-1">
              <p class="font-medium">New student registration</p>
              <p class="text-sm text-gray-600">
                Jamie Smith registered for CS-101
              </p>
              <p class="text-xs text-gray-500 mt-1">10 minutes ago</p>
            </div>
          </div>

          <div class="flex items-start p-3 border border-gray-200 rounded-lg">
            <div class="bg-blue-100 text-blue-800 p-2 rounded-lg mr-4">
              <i class="fas fa-book"></i>
            </div>
            <div class="flex-1">
              <p class="font-medium">Course created</p>
              <p class="text-sm text-gray-600">
                New course "Machine Learning" added
              </p>
              <p class="text-xs text-gray-500 mt-1">2 hours ago</p>
            </div>
          </div>

          <div class="flex items-start p-3 border border-gray-200 rounded-lg">
            <div class="bg-amber-100 text-amber-800 p-2 rounded-lg mr-4">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="flex-1">
              <p class="font-medium">System warning</p>
              <p class="text-sm text-gray-600">High load on database server</p>
              <p class="text-xs text-gray-500 mt-1">5 hours ago</p>
            </div>
          </div>

          <div class="flex items-start p-3 border border-gray-200 rounded-lg">
            <div class="bg-purple-100 text-purple-800 p-2 rounded-lg mr-4">
              <i class="fas fa-file-export"></i>
            </div>
            <div class="flex-1">
              <p class="font-medium">Report generated</p>
              <p class="text-sm text-gray-600">
                Semester enrollment report exported
              </p>
              <p class="text-xs text-gray-500 mt-1">Yesterday, 3:45 PM</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-bolt text-amber-500 mr-2"></i> Quick Actions
        </h3>

        <div class="grid grid-cols-2 gap-4">
          <a
            href="#"
            class="p-4 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition-colors"
          >
            <div class="bg-blue-100 p-3 rounded-lg inline-flex">
              <i class="fas fa-user-plus text-blue-600 text-xl"></i>
            </div>
            <p class="font-medium mt-2">Add User</p>
            <p class="text-xs text-gray-600">Create new account</p>
          </a>

          <a
            href="#"
            class="p-4 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition-colors"
          >
            <div class="bg-green-100 p-3 rounded-lg inline-flex">
              <i class="fas fa-book text-green-600 text-xl"></i>
            </div>
            <p class="font-medium mt-2">Manage Courses</p>
            <p class="text-xs text-gray-600">Add/edit courses</p>
          </a>

          <a
            href="#"
            class="p-4 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition-colors"
          >
            <div class="bg-purple-100 p-3 rounded-lg inline-flex">
              <i class="fas fa-chart-bar text-purple-600 text-xl"></i>
            </div>
            <p class="font-medium mt-2">View Reports</p>
            <p class="text-xs text-gray-600">Analytics & insights</p>
          </a>

          <a
            href="#"
            class="p-4 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition-colors"
          >
            <div class="bg-red-100 p-3 rounded-lg inline-flex">
              <i class="fas fa-cog text-red-600 text-xl"></i>
            </div>
            <p class="font-medium mt-2">System Settings</p>
            <p class="text-xs text-gray-600">Configure system</p>
          </a>
        </div>
      </div>
    </div>

    <!-- System Alerts -->
    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-bold text-gray-800 flex items-center">
          <i class="fas fa-bell text-red-500 mr-2"></i> System Alerts
        </h3>
        <button
          class="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
        >
          View All <i class="fas fa-chevron-right ml-1"></i>
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr
              class="text-left text-sm text-gray-500 border-b border-gray-200"
            >
              <th class="pb-3 font-medium">Alert</th>
              <th class="pb-3 font-medium">Severity</th>
              <th class="pb-3 font-medium">Department</th>
              <th class="pb-3 font-medium">Date</th>
              <th class="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr>
              <td class="py-3">
                <p class="font-medium">Database performance degradation</p>
                <p class="text-sm text-gray-600">
                  Response times above threshold
                </p>
              </td>
              <td class="py-3">
                <span
                  class="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded"
                  >High</span
                >
              </td>
              <td class="py-3">
                <p class="text-gray-600">IT</p>
              </td>
              <td class="py-3">
                <p class="text-gray-600">Today, 10:30 AM</p>
              </td>
              <td class="py-3">
                <span
                  class="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1 rounded"
                  >Investigating</span
                >
              </td>
            </tr>
            <tr>
              <td class="py-3">
                <p class="font-medium">Course enrollment capacity reached</p>
                <p class="text-sm text-gray-600">CS-301 at maximum capacity</p>
              </td>
              <td class="py-3">
                <span
                  class="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1 rounded"
                  >Medium</span
                >
              </td>
              <td class="py-3">
                <p class="text-gray-600">Registrar</p>
              </td>
              <td class="py-3">
                <p class="text-gray-600">Yesterday, 2:15 PM</p>
              </td>
              <td class="py-3">
                <span
                  class="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded"
                  >Pending</span
                >
              </td>
            </tr>
            <tr>
              <td class="py-3">
                <p class="font-medium">Backup completed with warnings</p>
                <p class="text-sm text-gray-600">
                  3 files skipped during backup
                </p>
              </td>
              <td class="py-3">
                <span
                  class="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded"
                  >Low</span
                >
              </td>
              <td class="py-3">
                <p class="text-gray-600">IT</p>
              </td>
              <td class="py-3">
                <p class="text-gray-600">Oct 10, 11:30 PM</p>
              </td>
              <td class="py-3">
                <span
                  class="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded"
                  >Resolved</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>`,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home {}
