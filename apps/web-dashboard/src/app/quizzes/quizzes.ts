import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Prisma } from '@prisma/client';
import { Apollo, gql } from 'apollo-angular';
import { map, of } from 'rxjs';
import Store from '../core/store';

@Component({
  selector: 'app-quizzes',
  imports: [RouterLink],
  template: `<div class="breadcrumbs text-sm">
      <ul>
        <li><a routerLink="/">Inicio</a></li>
        <li>Quizes</li>
      </ul>
    </div>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold mb-2">Quizes</h1>
      <a class="btn btn-primary" routerLink="new">Nuevo quiz</a>
    </div>`,
})
export default class Quizzes {
  public store = inject(Store);
  private apollo = inject(Apollo);

  public quizzesResource = rxResource({
    params: () => ({
      organizationId: this.store.currentOrganizationId(),
    }),
    stream: ({ params }) => {
      if (!params.organizationId) {
        return of([]);
      }
      return this.apollo
        .watchQuery<{
          quizzes: Prisma.QuizGetPayload<{
            include: { course: true; teacher: true };
          }>[];
        }>({
          query: gql`
            query Quizzes($organizationId: String!) {
              quizzes(organizationId: $organizationId) {
                id
                title
                createdAt
                updatedAt
                course {
                  id
                  name
                }
                teacher {
                  id
                  firstName
                  fatherName
                }
              }
            }
          `,
          variables: {
            organizationId: params.organizationId,
          },
        })
        .valueChanges.pipe(map((result) => result.data?.quizzes));
    },
  });
}
