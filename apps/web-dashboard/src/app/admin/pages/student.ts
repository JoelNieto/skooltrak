import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
type StudentType = Prisma.StudentGetPayload<{
  include: { classGroup: true; user: true; courses: true };
}> & {
  name: string;
  email: string;
};

@Component({
  selector: 'app-student',
  imports: [RouterLink],
  template: ` <div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li><a routerLink="/students">Alumnos</a></li>
        @if (student.value()) {
        <li>{{ student.value()?.name }}</li>
        }
      </ul>
    </div>
    <div class="min-h-screen">
      <div class="container mx-auto py-8">
        <!-- Header -->
        <div
          class="bg-linear-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white mb-8 shadow-lg"
        >
          <div
            class="flex flex-col md:flex-row justify-between items-start md:items-center"
          >
            <div class="flex items-center space-x-4">
              <div class="relative">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="Student Photo"
                  class="w-20 h-20 rounded-full border-4 border-white/30 shadow-lg"
                />
                <span
                  class="absolute bottom-0 right-0 bg-green-500 rounded-full p-1 border-2 border-white"
                >
                  <i class="fas fa-check text-white text-xs"></i>
                </span>
              </div>
              <div>
                <h1 class="text-2xl font-bold">Alex Johnson</h1>
                <p class="text-white/80">
                  Computer Science Major • Student ID: STU-2023-8472
                </p>
                <div class="flex items-center mt-2 space-x-4">
                  <span class="flex items-center text-sm">
                    <i class="fas fa-envelope mr-1"></i>
                    alex.johnson@university.edu
                  </span>
                  <span class="flex items-center text-sm">
                    <i class="fas fa-phone mr-1"></i> (555) 123-4567
                  </span>
                </div>
              </div>
            </div>
            <div class="mt-4 md:mt-0">
              <button class="btn btn-primary">Edit Profile</button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <!-- Left Column - Personal Info & Class Group -->
          <div class="xl:col-span-4 space-y-6">
            <!-- Personal Information -->
            <div
              class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
            >
              <h2
                class="text-xl font-bold text-gray-800 mb-4 flex items-center"
              >
                <i class="fas fa-user-circle text-blue-500 mr-2"></i> Personal
                Information
              </h2>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-4">
                  <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">
                      Date of Birth
                    </p>
                    <p class="text-gray-800 font-medium">March 15, 2002</p>
                  </div>

                  <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">
                      Nationality
                    </p>
                    <p class="text-gray-800 font-medium">United States</p>
                  </div>

                  <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">
                      Enrollment Date
                    </p>
                    <p class="text-gray-800 font-medium">August 28, 2023</p>
                  </div>
                </div>

                <div class="space-y-4">
                  <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">
                      Address
                    </p>
                    <p class="text-gray-800 font-medium">
                      123 University Ave, Campus Town, ST 12345
                    </p>
                  </div>

                  <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">
                      Status
                    </p>
                    <p class="text-green-600 font-medium flex items-center">
                      <i class="fas fa-circle text-green-500 text-xs mr-1"></i>
                      Active
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Emergency Contact -->
            <div
              class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
            >
              <h2
                class="text-xl font-bold text-gray-800 mb-4 flex items-center"
              >
                <i class="fas fa-exclamation-triangle text-amber-500 mr-2"></i>
                Emergency Contact
              </h2>

              <div
                class="flex items-start space-x-4 p-4 bg-amber-50 rounded-xl"
              >
                <div class="bg-amber-100 p-3 rounded-full">
                  <i class="fas fa-user-friends text-amber-600"></i>
                </div>
                <div>
                  <h3 class="font-bold text-gray-800">Robert Johnson</h3>
                  <p class="text-gray-600">Father • (555) 987-6543</p>
                  <p class="text-sm text-gray-500 mt-1">
                    Primary Emergency Contact
                  </p>
                </div>
              </div>
            </div>

            <!-- Class Group -->
            <div
              class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
            >
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-gray-800 flex items-center">
                  <i class="fas fa-users text-purple-500 mr-2"></i> Class Group
                </h2>
                <span
                  class="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full"
                >
                  CS-2023-A
                </span>
              </div>

              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">
                      Academic Year
                    </p>
                    <p class="text-gray-800 font-medium">2023-2024</p>
                  </div>

                  <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">
                      Semester
                    </p>
                    <p class="text-gray-800 font-medium">Fall 2023</p>
                  </div>
                </div>

                <div>
                  <p class="text-xs text-gray-500 uppercase tracking-wide">
                    Advisor
                  </p>
                  <p class="text-gray-800 font-medium">Dr. Sarah Williams</p>
                  <p class="text-sm text-gray-600">s.williams@university.edu</p>
                </div>

                <div>
                  <p class="text-xs text-gray-500 uppercase tracking-wide mb-2">
                    Group Members
                  </p>
                  <div class="flex -space-x-2">
                    <img
                      class="w-10 h-10 rounded-full border-2 border-white"
                      src="https://randomuser.me/api/portraits/women/44.jpg"
                      alt="Student"
                    />
                    <img
                      class="w-10 h-10 rounded-full border-2 border-white"
                      src="https://randomuser.me/api/portraits/men/32.jpg"
                      alt="Student"
                    />
                    <img
                      class="w-10 h-10 rounded-full border-2 border-white"
                      src="https://randomuser.me/api/portraits/women/68.jpg"
                      alt="Student"
                    />
                    <img
                      class="w-10 h-10 rounded-full border-2 border-white"
                      src="https://randomuser.me/api/portraits/men/55.jpg"
                      alt="Student"
                    />
                    <div
                      class="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-medium"
                    >
                      +12
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column - Courses -->
          <div class="xl:col-span-8">
            <div
              class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
            >
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-800 flex items-center">
                  <i class="fas fa-book-open text-indigo-500 mr-2"></i> Enrolled
                  Courses
                </h2>
                <div class="flex space-x-2">
                  <span
                    class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full"
                    >4 courses</span
                  >
                  <button
                    class="text-sm bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-full transition-colors flex items-center"
                  >
                    <i class="fas fa-plus mr-1"></i> Add Course
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <!-- Course 1 -->
                <div
                  class="course-card border border-gray-200 rounded-xl p-5 hover:bg-gray-50 transition-all duration-300"
                >
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <span
                        class="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mb-2"
                        >CS 301</span
                      >
                      <h3 class="font-bold text-gray-800">
                        Data Structures & Algorithms
                      </h3>
                      <p class="text-gray-600 text-sm">Prof. Michael Chen</p>
                    </div>
                    <span
                      class="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded"
                      >In Progress</span
                    >
                  </div>

                  <div class="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <p class="text-xs text-gray-500">Schedule</p>
                      <p class="text-sm font-medium">Mon, Wed 10:00 AM</p>
                    </div>

                    <div>
                      <p class="text-xs text-gray-500">Room</p>
                      <p class="text-sm font-medium">Science Bldg 204</p>
                    </div>

                    <div>
                      <p class="text-xs text-gray-500">Credits</p>
                      <p class="text-sm font-medium">4</p>
                    </div>

                    <div>
                      <p class="text-xs text-gray-500">Grade</p>
                      <p class="text-sm font-medium">-</p>
                    </div>
                  </div>

                  <div
                    class="mt-4 pt-4 border-t border-gray-100 flex justify-between"
                  >
                    <button
                      class="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                    >
                      <i class="fas fa-calendar-alt mr-1"></i> Schedule
                    </button>
                    <button
                      class="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center"
                    >
                      <i class="fas fa-chart-bar mr-1"></i> Progress
                    </button>
                  </div>
                </div>

                <!-- Course 2 -->
                <div
                  class="course-card border border-gray-200 rounded-xl p-5 hover:bg-gray-50 transition-all duration-300"
                >
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <span
                        class="inline-block bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded mb-2"
                        >MATH 240</span
                      >
                      <h3 class="font-bold text-gray-800">
                        Discrete Mathematics
                      </h3>
                      <p class="text-gray-600 text-sm">Dr. Emily Rodriguez</p>
                    </div>
                    <span
                      class="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded"
                      >In Progress</span
                    >
                  </div>

                  <div class="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <p class="text-xs text-gray-500">Schedule</p>
                      <p class="text-sm font-medium">Tue, Thu 1:30 PM</p>
                    </div>

                    <div>
                      <p class="text-xs text-gray-500">Room</p>
                      <p class="text-sm font-medium">Math Bldg 105</p>
                    </div>

                    <div>
                      <p class="text-xs text-gray-500">Credits</p>
                      <p class="text-sm font-medium">3</p>
                    </div>

                    <div>
                      <p class="text-xs text-gray-500">Grade</p>
                      <p class="text-sm font-medium">-</p>
                    </div>
                  </div>

                  <div
                    class="mt-4 pt-4 border-t border-gray-100 flex justify-between"
                  >
                    <button
                      class="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                    >
                      <i class="fas fa-calendar-alt mr-1"></i> Schedule
                    </button>
                    <button
                      class="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center"
                    >
                      <i class="fas fa-chart-bar mr-1"></i> Progress
                    </button>
                  </div>
                </div>

                <!-- Course 3 -->
                <div
                  class="course-card border border-gray-200 rounded-xl p-5 hover:bg-gray-50 transition-all duration-300"
                >
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <span
                        class="inline-block bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1 rounded mb-2"
                        >CS 350</span
                      >
                      <h3 class="font-bold text-gray-800">
                        Software Engineering
                      </h3>
                      <p class="text-gray-600 text-sm">Dr. James Wilson</p>
                    </div>
                    <span
                      class="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded"
                      >In Progress</span
                    >
                  </div>

                  <div class="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <p class="text-xs text-gray-500">Schedule</p>
                      <p class="text-sm font-medium">Mon, Wed, Fri 2:00 PM</p>
                    </div>

                    <div>
                      <p class="text-xs text-gray-500">Room</p>
                      <p class="text-sm font-medium">Tech Center 312</p>
                    </div>

                    <div>
                      <p class="text-xs text-gray-500">Credits</p>
                      <p class="text-sm font-medium">4</p>
                    </div>

                    <div>
                      <p class="text-xs text-gray-500">Grade</p>
                      <p class="text-sm font-medium">-</p>
                    </div>
                  </div>

                  <div
                    class="mt-4 pt-4 border-t border-gray-100 flex justify-between"
                  >
                    <button
                      class="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                    >
                      <i class="fas fa-calendar-alt mr-1"></i> Schedule
                    </button>
                    <button
                      class="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center"
                    >
                      <i class="fas fa-chart-bar mr-1"></i> Progress
                    </button>
                  </div>
                </div>

                <!-- Course 4 -->
                <div
                  class="course-card border border-gray-200 rounded-xl p-5 hover:bg-gray-50 transition-all duration-300"
                >
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <span
                        class="inline-block bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-1 rounded mb-2"
                        >PHYS 150</span
                      >
                      <h3 class="font-bold text-gray-800">
                        Introduction to Physics
                      </h3>
                      <p class="text-gray-600 text-sm">Prof. Lisa Thompson</p>
                    </div>
                    <span
                      class="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded"
                      >Completed</span
                    >
                  </div>

                  <div class="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <p class="text-xs text-gray-500">Schedule</p>
                      <p class="text-sm font-medium">Completed</p>
                    </div>

                    <div>
                      <p class="text-xs text-gray-500">Room</p>
                      <p class="text-sm font-medium">-</p>
                    </div>

                    <div>
                      <p class="text-xs text-gray-500">Credits</p>
                      <p class="text-sm font-medium">3</p>
                    </div>

                    <div>
                      <p class="text-xs text-gray-500">Grade</p>
                      <p class="text-sm font-medium text-green-600">A-</p>
                    </div>
                  </div>

                  <div
                    class="mt-4 pt-4 border-t border-gray-100 flex justify-between"
                  >
                    <button
                      class="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                    >
                      <i class="fas fa-file-alt mr-1"></i> Materials
                    </button>
                    <button
                      class="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center"
                    >
                      <i class="fas fa-certificate mr-1"></i> Certificate
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Academic Progress -->
            <div
              class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mt-6"
            >
              <h2
                class="text-xl font-bold text-gray-800 mb-4 flex items-center"
              >
                <i class="fas fa-chart-line text-green-500 mr-2"></i> Academic
                Progress
              </h2>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-gray-50 p-4 rounded-xl text-center">
                  <p class="text-sm text-gray-500">Current GPA</p>
                  <p class="text-2xl font-bold text-gray-800 mt-1">3.72</p>
                  <p
                    class="text-xs text-green-600 mt-1 flex items-center justify-center"
                  >
                    <i class="fas fa-arrow-up mr-1"></i> +0.15 from last
                    semester
                  </p>
                </div>

                <div class="bg-gray-50 p-4 rounded-xl text-center">
                  <p class="text-sm text-gray-500">Credits Completed</p>
                  <p class="text-2xl font-bold text-gray-800 mt-1">45</p>
                  <p class="text-xs text-gray-600 mt-1">of 120 required</p>
                </div>

                <div class="bg-gray-50 p-4 rounded-xl text-center">
                  <p class="text-sm text-gray-500">Expected Graduation</p>
                  <p class="text-2xl font-bold text-gray-800 mt-1">May 2025</p>
                  <p class="text-xs text-gray-600 mt-1">On track</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`,
})
export default class Student {
  public id = input.required<string>();
  private apollo = inject(Apollo);
  public student = rxResource({
    params: () => ({
      id: this.id(),
    }),
    stream: ({ params }) => {
      const { id } = params;
      if (!id) {
        return of(null);
      }
      return this.apollo
        .watchQuery<{
          student: StudentType;
        }>({
          query: gql`
            query Student($id: String!) {
              student(id: $id) {
                id
                firstName
                fatherName
                name
                classGroup {
                  name
                }
                courses {
                  name
                }
              }
            }
          `,
          variables: {
            id: params.id,
          },
        })
        .valueChanges.pipe(map((result) => result.data.student));
    },
  });
}
