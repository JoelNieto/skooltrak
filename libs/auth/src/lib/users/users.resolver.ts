import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { FetchDataInput } from '../fetch-data-input';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput);
  }

  @Query(() => [User], { name: 'users' })
  findAll(@Args() fetchDataInput: FetchDataInput) {
    return this.usersService.findAll(fetchDataInput);
  }

  @Query(() => Int, { name: 'usersCount' })
  count(@Args() fetchDataInput: FetchDataInput) {
    return this.usersService.count(fetchDataInput);
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.usersService.findOne(id);
  }

  @ResolveField(() => String)
  name(@Parent() user: User) {
    return `${user.firstName} ${user.lastName}`;
  }

  @ResolveField(() => String)
  initials(@Parent() user: User) {
    return `${user.firstName[0]}${user.lastName[0]}`;
  }

  @Mutation(() => User)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput.id, updateUserInput);
  }

  @Mutation(() => User)
  removeUser(@Args('id', { type: () => String }) id: string) {
    return this.usersService.remove(id);
  }
}
