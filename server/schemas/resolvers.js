const { Book, User } = require('../models');
const { signToken } = require('../utils/auth');
const { AuthenticationError } = require('apollo-server-express');

const resolvers = {
	Query: {
		me: async (_, args, context) => {
			if(context.user) {
				const userData = await User.findOne({_id: context.user._id})
					.select('-__v -password')
					.populate('savedBooks');

				return userData;
			}
			return new AuthenticationError('Not logged in');
		}
	},
	Mutation: {
		addUser: async(_, args) => {
			console.log(args);
			const user = await User.create(args);
			const token = signToken(user);

			return {token, user};
		},
		login: async (_, {email, password}) => {
			const user = await User.findOne({email});

			if (!user) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);
      return { token, user };
		},
		saveBook: async (_, args, context) => {
			if(context.user) {
				const updatedUser = await User.findOneAndUpdate(
					{_id: context.user._id},
					{$addToSet: { savedBooks: args }},
					{new: true, runValidators: true}
				);

				return updatedUser;
			}
			throw new AuthenticationError('You need to be logged in!');
		},
		removeBook: async(_, args, context) => {
			if(context.user) {
				const updatedUser = await User.findOneAndUpdate(
					{_id: context.user._id},
					{$pull: {
						bookId: args.bookId
					}},
					{new: true, runValidators: true}
				);

				return updatedUser;
			}
			throw new AuthenticationError('You need to be logged in!');
		}
	}
}

module.exports = resolvers;