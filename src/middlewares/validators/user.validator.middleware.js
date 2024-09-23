import Joi from 'joi';

// 회원가입 검증
const signUpValidator = async (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string()
      .pattern(/^[a-zA-Z0-9가-힣]*$/) //영문자(대소문자), 숫자, 그리고 한글만 포함
      .min(3)
      .max(20),
  });

  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    const key = error.details[0].context.key;
    const type = error.details[0].type;
    console.log(key);
    console.log(type);
    if (error) {
      if (key === 'email') {
        if (type === 'any.required') {
          return res.status(400).json({ message: '이메일은 필수 항목입니다.' });
        } else if (type === 'string.email') {
          return res.status(400).json({ message: '유효한 이메일 주소를 입력해 주세요.' });
        }
      } else if (key === 'password') {
        if (type === 'any.required') {
          return res.status(400).json({ message: '비밀번호는 필수 항목입니다.' });
        } else if (type === 'string.min') {
          return res.status(400).json({ message: '비밀번호는 최소 6자리 이상이어야 합니다.' });
        }
      } else if (key === 'name') {
        if (type === 'any.required') {
          return res.status(400).json({ message: '구단주 명은 필수 항목입니다.' });
        } else if (type === 'string.pattern.base') {
          return res
            .status(400)
            .json({ message: '영문자(대소문자), 숫자, 그리고 한글만 포함되어야 합니다.' });
        }
      }
      return res.status(400).json({ message: error.details[0].message });
    }
  }
};

// 로그인 검증
const signInValidator = async (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    const key = error.details[0].context.key;
    const type = error.details[0].type;
    console.log(key);
    console.log(type);
    if (error) {
      if (key === 'email') {
        if (type === 'any.required' || type === 'string.empty') {
          return res.status(400).json({ message: '이메일을 입력해 주세요' });
        } else if (type === 'string.email') {
          return res.status(400).json({ message: '유효한 이메일 주소를 입력해 주세요.' });
        }
      } else if (key === 'password') {
        if (type === 'any.required' || type === 'string.empty') {
          return res.status(400).json({ message: '비밀번호를 입력해 주세요' });
        }
      }
      return res.status(400).json({ message: error.details[0].message });
    }
  }
};

// 캐시충전 검증
const cashValidator = async (req, res, next) => {
  const schema = Joi.object({
    cash: Joi.number().required(),
  });

  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    const key = error.details[0].context.key;
    const type = error.details[0].type;
    console.log(key);
    console.log(type);
    if (error) {
      if (key === 'cash') {
        if (type === 'any.required') {
          return res.status(400).json({ message: '충전할 캐시를 입력해 주세요' });
        } else if (type === 'number.base') {
          return res.status(400).json({ message: '캐시는 숫자로만 입력 가능합니다' });
        }
      }
      return res.status(400).json({ message: error.details[0].message });
    }
  }
};

export { signUpValidator, signInValidator, cashValidator };
