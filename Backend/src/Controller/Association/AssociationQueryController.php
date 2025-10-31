<?php

/**
 * src/Controller/Association/AssociationQueryController.php
 *
 * @license https://opensource.org/licenses/MIT MIT License
 * @link    https://www.etsisi.upm.es/ ETS de Ingeniería de Sistemas Informáticos
 */

namespace TDW\ACiencia\Controller\Association;

use Fig\Http\Message\StatusCodeInterface as StatusCode;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Http\Response;
use TDW\ACiencia\Controller\Element\ElementBaseQueryController;
use TDW\ACiencia\Entity\Association;
use TDW\ACiencia\Entity\Element;
use TDW\ACiencia\Utility\Error;

class AssociationQueryController extends ElementBaseQueryController
{
    /**
     * @var string ruta api gestion asociaciones
     */
    public const string PATH_ASSOCIATIONS = '/associations';

    public static function getEntitiesTag(): string
    {
        return substr(self::PATH_ASSOCIATIONS, 1);
    }

    public static function getEntityClassName(): string
    {
        return Association::class;
    }

    public static function getEntityIdName(): string
    {
        return 'associationId';
    }

}