const ApiError = require('../services/apiError');
const Tool = require('../models/tool');

exports.getTools = async (req, res, next) => {
  try {
    const { tag, title, page } = req.query;
    let tools;

    if (tag && page && !title) {
      tools = await Tool.paginate(
        {
          tags: { $regex: tag, $options: 'i' }
        },
        { page: page, limit: 3 }
      );
    } else if (title && page && !tag) {
      tools = await Tool.paginate(
        {
          title: { $regex: title, $options: 'i' }
        },
        { page: page, limit: 3 }
      );
    } else if (!page && !tag && !title) {
      tools = await Tool.find();
      return res.status(200).json({ docs: tools });
    } else {
      tools = await Tool.paginate({}, { page: page, limit: 3 });
    }

    if (!tools) throw new ApiError('Tools not found', 400, 'No tools registered with this tag.');

    return res.status(200).json(tools);
  } catch (error) {
    next(error);
  }
};

exports.postTool = async (req, res, next) => {
  try {
    const { title, link, description, tags } = req.body;

    if (!title || !link || !description || !tags)
      throw new ApiError('Missing field', 400, 'One or more fields are missing.');

    if (await Tool.findOne({ title }))
      throw new ApiError('Tool already registered', 400, 'This title is already in use.');

    const tool = await Tool.create({
      title: title,
      link: link,
      description: description,
      tags: tags
    });

    tool.save();

    return res.status(201).json(tool);
  } catch (error) {
    next(error);
  }
};

exports.patchTool = async (req, res, next) => {
  try {
    const { title, link, description, tags } = req.body;
    const { id } = req.params;

    if (!title && !link && !description && !tags)
      throw new ApiError('Nothing to edit', 400, 'No field entered to edit.');

    if (!Array.isArray(tags)) throw new ApiError('Tags is not array', 400, 'Tags most be an array');

    const tool = await Tool.findById(id);

    if (!tool) throw new ApiError('Tools not found', 400, 'No tools registered with this id.');

    if (title) tool.title = title;
    if (link) tool.link = link;
    if (description) tool.description = description;
    if (tags) {
      const deleteTags = tool.tags.filter(tag => tags.includes(tag));
      const addTags = tags.filter(tag => !tool.tags.includes(tag));
      const newTags = [...deleteTags, ...addTags];

      tool.tags = [...new Set(newTags)];
    }

    await tool.save();

    res.status(200).json(tool);
  } catch (error) {
    next(error);
  }
};

exports.deleteTool = async (req, res, next) => {
  try {
    const id = req.params.id;

    const tool = await Tool.findById(id);

    if (!tool) throw new ApiError('Tools not found', 400, 'No tools registered with this id.');

    await Tool.findByIdAndRemove(id);

    return res.status(200).json({});
  } catch (error) {
    next(error);
  }
};
